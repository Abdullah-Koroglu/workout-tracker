import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";

const TEST_DATE_FILE = resolve(process.cwd(), ".test-date.json");

function parseLocalDate(dateValue: string): Date | null {
  const [yearRaw, monthRaw, dayRaw] = dateValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getTestDateString(): string | null {
  if (!existsSync(TEST_DATE_FILE)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(TEST_DATE_FILE, "utf-8")) as { date?: string };
    return typeof parsed.date === "string" ? parsed.date : null;
  } catch {
    return null;
  }
}

export function getCurrentDate(): Date {
  const testDate = getTestDateString();
  if (!testDate) {
    return new Date();
  }

  const parsed = parseLocalDate(testDate);
  return parsed ?? new Date();
}

export function getCurrentDayStart(): Date {
  const current = getCurrentDate();
  current.setHours(0, 0, 0, 0);
  return current;
}

export function setTestDateString(dateValue: string): boolean {
  const parsed = parseLocalDate(dateValue);
  if (!parsed) {
    return false;
  }

  writeFileSync(
    TEST_DATE_FILE,
    JSON.stringify({ date: dateValue, createdAt: new Date().toISOString() }, null, 2)
  );

  return true;
}

export function clearTestDateString() {
  if (!existsSync(TEST_DATE_FILE)) {
    return;
  }

  unlinkSync(TEST_DATE_FILE);
}