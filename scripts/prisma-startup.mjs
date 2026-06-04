import { spawnSync } from "node:child_process";
import process from "node:process";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function runPrisma(args) {
  const result = spawnSync("./node_modules/.bin/prisma", args, {
    stdio: "pipe",
    env: process.env,
    encoding: "utf8",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    const error = new Error(`Command failed: ./node_modules/.bin/prisma ${args.join(" ")}`);
    error.status = result.status;
    error.stdout = result.stdout ?? "";
    error.stderr = result.stderr ?? "";
    throw error;
  }
}

function isRecoverableMigrationFailure(error) {
  const output = `${error?.stdout ?? ""}\n${error?.stderr ?? ""}\n${error?.message ?? ""}`;
  return output.includes("P3005") || output.includes("P3009");
}

async function main() {
  const migrationTableRows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = '_prisma_migrations'
    ) AS "exists"
  `;

  const hasMigrationTable = Array.isArray(migrationTableRows) && Boolean(migrationTableRows[0]?.exists);

  if (hasMigrationTable) {
    console.log("[prisma-startup] _prisma_migrations bulundu, migrate deploy calisiyor.");
    try {
      runPrisma(["migrate", "deploy", "--schema=/app/prisma/schema.prisma"]);
    } catch (error) {
      if (!isRecoverableMigrationFailure(error)) {
        throw error;
      }

      console.log("[prisma-startup] migrate deploy recoverable failure verdi, db push fallback calisiyor.");
      runPrisma(["db", "push", "--skip-generate", "--schema=/app/prisma/schema.prisma"]);
    }
    return;
  }

  const userTableRows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS "count"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name NOT IN ('_prisma_migrations')
  `;

  const tableCount = Array.isArray(userTableRows) ? Number(userTableRows[0]?.count ?? 0) : 0;

  if (tableCount === 0) {
    console.log("[prisma-startup] Bos schema bulundu, migrate deploy calisiyor.");
    runPrisma(["migrate", "deploy", "--schema=/app/prisma/schema.prisma"]);
    return;
  }

  console.log("[prisma-startup] Legacy dolu schema bulundu, db push ile Prisma schema hizalaniyor.");
  runPrisma(["db", "push", "--skip-generate", "--schema=/app/prisma/schema.prisma"]);
}

main()
  .catch((error) => {
    console.error("[prisma-startup] basarisiz:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
