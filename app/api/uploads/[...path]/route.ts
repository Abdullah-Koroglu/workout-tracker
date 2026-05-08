import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from "next/server";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".svg": "image/svg+xml",
};

function isSafeSegment(segment: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(segment);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const parts = params.path ?? [];

  if (parts.length < 2 || parts.some((segment) => !isSafeSegment(segment))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const topFolder = parts[0];
  if (!["avatars", "meals", "checkins", "transformations"].includes(topFolder)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absPath = path.join(process.cwd(), "public", "uploads", ...parts);

  let stat;
  try {
    stat = await fs.stat(absPath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!stat.isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = await fs.readFile(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Uploads-Route": "api-runtime",
    },
  });
}