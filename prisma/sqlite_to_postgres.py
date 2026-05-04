#!/usr/bin/env python3

from __future__ import annotations

import datetime as dt
import json
import os
import sqlite3
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
SQLITE_DB = ROOT / "prisma" / "dev.db"
TABLE_ORDER = [
    "User",
    "CoachClientRelation",
    "Exercise",
    "WorkoutTemplate",
    "WorkoutTemplateExercise",
    "TemplateAssignment",
    "Workout",
    "WorkoutSet",
    "Comment",
    "Message",
    "Notification",
    "ClientProfile",
    "CoachProfile",
    "CoachPackage",
]
BOOLEAN_COLUMNS = {
    ("CoachPackage", "isActive"),
    ("Message", "isRead"),
    ("Notification", "isRead"),
    ("TemplateAssignment", "isOneTime"),
    ("WorkoutSet", "completed"),
}
JSON_COLUMNS = {
    ("User", "pushSubscription"),
    ("CoachProfile", "specialties"),
    ("WorkoutTemplateExercise", "protocol"),
}
DATETIME_COLUMNS = {
    ("ClientProfile", "birthDate"),
    ("ClientProfile", "updatedAt"),
    ("CoachClientRelation", "createdAt"),
    ("CoachPackage", "createdAt"),
    ("CoachPackage", "updatedAt"),
    ("CoachProfile", "updatedAt"),
    ("Comment", "createdAt"),
    ("Exercise", "createdAt"),
    ("Message", "createdAt"),
    ("Notification", "createdAt"),
    ("TemplateAssignment", "scheduledFor"),
    ("TemplateAssignment", "createdAt"),
    ("User", "createdAt"),
    ("Workout", "startedAt"),
    ("Workout", "finishedAt"),
    ("WorkoutTemplate", "createdAt"),
}


def quote_ident(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def quote_text(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def normalize_datetime(value: object) -> str:
    if isinstance(value, (int, float)):
        seconds = float(value)
        if abs(seconds) > 100_000_000_000:
            seconds /= 1000.0
        normalized = dt.datetime.fromtimestamp(seconds, tz=dt.timezone.utc).replace(tzinfo=None)
    elif isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            raise ValueError("Empty datetime string")
        try:
            numeric = float(stripped)
        except ValueError:
            normalized = dt.datetime.fromisoformat(stripped.replace("Z", "+00:00"))
            if normalized.tzinfo is not None:
                normalized = normalized.astimezone(dt.timezone.utc).replace(tzinfo=None)
        else:
            seconds = numeric / 1000.0 if abs(numeric) > 100_000_000_000 else numeric
            normalized = dt.datetime.fromtimestamp(seconds, tz=dt.timezone.utc).replace(tzinfo=None)
    else:
        raise TypeError(f"Unsupported datetime value: {value!r}")

    return normalized.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]


def format_literal(table: str, column: str, value: object) -> str:
    if value is None:
        return "NULL"

    if (table, column) in BOOLEAN_COLUMNS:
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "1"}:
                return "TRUE"
            if lowered in {"false", "0"}:
                return "FALSE"
            raise ValueError(f"Unsupported boolean value {value!r} for {table}.{column}")
        return "TRUE" if bool(value) else "FALSE"

    if (table, column) in DATETIME_COLUMNS:
        return quote_text(normalize_datetime(value))

    if (table, column) in JSON_COLUMNS:
        if isinstance(value, str):
            normalized_json = json.dumps(json.loads(value), ensure_ascii=False, separators=(",", ":"))
        else:
            normalized_json = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        return f"{quote_text(normalized_json)}::jsonb"

    if isinstance(value, str):
        return quote_text(value)

    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"

    return str(value)


def collect_sqlite_counts(connection: sqlite3.Connection) -> dict[str, int]:
    counts: dict[str, int] = {}
    for table in TABLE_ORDER:
        counts[table] = connection.execute(f'SELECT COUNT(*) FROM {quote_ident(table)}').fetchone()[0]
    return counts


def build_import_sql(connection: sqlite3.Connection) -> str:
    statements = ["BEGIN;", "SET session_replication_role = replica;"]
    truncate_targets = ", ".join(quote_ident(table) for table in TABLE_ORDER)
    statements.append(f"TRUNCATE TABLE {truncate_targets} CASCADE;")

    for table in TABLE_ORDER:
        cursor = connection.execute(f'SELECT * FROM {quote_ident(table)}')
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        if not rows:
            continue

        quoted_columns = ", ".join(quote_ident(column) for column in columns)
        batch_size = 200
        for start in range(0, len(rows), batch_size):
            chunk = rows[start : start + batch_size]
            value_groups = []
            for row in chunk:
                values = ", ".join(
                    format_literal(table, column, row[index])
                    for index, column in enumerate(columns)
                )
                value_groups.append(f"({values})")

            statements.append(
                f'INSERT INTO {quote_ident(table)} ({quoted_columns}) VALUES\n  ' + ",\n  ".join(value_groups) + ";"
            )

    statements.extend([
        "SET session_replication_role = DEFAULT;",
        "COMMIT;",
    ])
    return "\n".join(statements) + "\n"


def run_psql(sql: str, extra_args: list[str] | None = None) -> str:
    mode = os.getenv("SQLITE_PG_RUN_MODE", "auto").strip().lower()
    command: list[str]

    if mode in {"auto", "direct"}:
        database_url = os.getenv("DATABASE_URL", "").strip()
        if database_url:
            parsed = urlparse(database_url)
            query = parse_qs(parsed.query)
            dbname = (parsed.path or "/fitcoach").lstrip("/") or "fitcoach"
            host = parsed.hostname or "postgres"
            port = str(parsed.port or 5432)
            user = parsed.username or "fitcoach"
            password = parsed.password or "fitcoach"
            schema = query.get("schema", [""])[0]
        else:
            dbname = os.getenv("PGDATABASE", "fitcoach")
            host = os.getenv("PGHOST", "postgres")
            port = os.getenv("PGPORT", "5432")
            user = os.getenv("PGUSER", "fitcoach")
            password = os.getenv("PGPASSWORD", "fitcoach")
            schema = os.getenv("PGSCHEMA", "")

        direct_command = [
            "psql",
            "-v",
            "ON_ERROR_STOP=1",
            "-h",
            host,
            "-p",
            port,
            "-U",
            user,
            "-d",
            dbname,
        ]

        if schema:
            direct_command.extend(["-v", f"search_path={schema}"])

        if mode == "direct":
            command = direct_command
        else:
            docker_path = subprocess.run(
                ["sh", "-lc", "command -v docker >/dev/null 2>&1"],
                cwd=ROOT,
                check=False,
            )
            command = (
                [
                    "docker",
                    "compose",
                    "exec",
                    "-T",
                    "postgres",
                    "psql",
                    "-v",
                    "ON_ERROR_STOP=1",
                    "-U",
                    "fitcoach",
                    "-d",
                    "fitcoach",
                ]
                if docker_path.returncode == 0
                else direct_command
            )
    else:
        command = [
            "docker",
            "compose",
            "exec",
            "-T",
            "postgres",
            "psql",
            "-v",
            "ON_ERROR_STOP=1",
            "-U",
            "fitcoach",
            "-d",
            "fitcoach",
        ]
    if extra_args:
        command.extend(extra_args)

    completed = subprocess.run(
        command,
        cwd=ROOT,
        input=sql,
        text=True,
        capture_output=True,
        check=False,
        env={**os.environ, "PGPASSWORD": password} if "password" in locals() else os.environ,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or completed.stdout.strip())
    return completed.stdout


def collect_postgres_counts() -> dict[str, int]:
    union_query = "\nUNION ALL\n".join(
        f"SELECT {quote_text(table)} AS table_name, COUNT(*)::bigint AS row_count FROM {quote_ident(table)}"
        for table in TABLE_ORDER
    )
    output = run_psql("", ["-At", "-F", "\t", "-c", union_query + ";"])
    counts: dict[str, int] = {}
    for line in output.strip().splitlines():
        if not line:
            continue
        table, value = line.split("\t", 1)
        counts[table] = int(value)
    return counts


def main() -> int:
    if not SQLITE_DB.exists():
        print(f"SQLite database not found: {SQLITE_DB}", file=sys.stderr)
        return 1

    sqlite_connection = sqlite3.connect(SQLITE_DB)
    try:
        source_counts = collect_sqlite_counts(sqlite_connection)
        import_sql = build_import_sql(sqlite_connection)
    finally:
        sqlite_connection.close()

    try:
        run_psql(import_sql)
        target_counts = collect_postgres_counts()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    mismatches = []
    for table in TABLE_ORDER:
        source_count = source_counts.get(table, 0)
        target_count = target_counts.get(table, 0)
        status = "OK" if source_count == target_count else "MISMATCH"
        print(f"{status}\t{table}\tsqlite={source_count}\tpostgres={target_count}")
        if source_count != target_count:
            mismatches.append(table)

    if mismatches:
        print("Count verification failed for: " + ", ".join(mismatches), file=sys.stderr)
        return 1

    print("SQLite to PostgreSQL migration completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())