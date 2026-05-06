import { promises as fs } from "fs";
import path from "path";

function toPublicPath(uploadUrl: string): string | null {
  if (!uploadUrl.startsWith("/uploads/")) return null;

  const [cleanPath] = uploadUrl.split(/[?#]/, 1);
  const relativePath = cleanPath.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", relativePath);
}

export async function uploadUrlExists(uploadUrl: string | null): Promise<boolean> {
  if (!uploadUrl) return false;

  const filePath = toPublicPath(uploadUrl);
  if (!filePath) return false;

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}