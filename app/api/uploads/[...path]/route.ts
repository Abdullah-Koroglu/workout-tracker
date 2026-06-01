import path from "path";

import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { getMediaFolderVisibility, readMediaFile, type MediaFolder } from "@/lib/media-storage";
import { prisma } from "@/lib/prisma";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

const MEDIA_FOLDERS = new Set<MediaFolder>(["avatars", "transformations", "meals", "checkins", "movement-videos"]);

function isSafeSegment(segment: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(segment);
}

function inferOwnerClientId(folder: MediaFolder, fileName: string) {
  const [first, second] = fileName.split("-");
  if (folder === "movement-videos") return first || null;
  if (folder === "meals" || folder === "checkins") return second || null;
  return null;
}

async function canReadProtectedMedia(folder: MediaFolder, fileName: string) {
  const auth = await requireAuth();
  if (auth.error) return { allowed: false, response: auth.error };

  const ownerClientId = inferOwnerClientId(folder, fileName);
  if (!ownerClientId) {
    return { allowed: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const user = auth.session.user;
  if (user.role === "CLIENT" && user.id === ownerClientId) {
    return { allowed: true };
  }

  if (user.role === "COACH") {
    const relation = await prisma.coachClientRelation.findFirst({
      where: { coachId: user.id, clientId: ownerClientId, status: "ACCEPTED" },
      select: { id: true },
    });
    if (relation) return { allowed: true };
  }

  return { allowed: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const parts = params.path ?? [];

  if (parts.length !== 2 || parts.some((segment) => !isSafeSegment(segment))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [folderRaw, fileName] = parts;
  if (!MEDIA_FOLDERS.has(folderRaw as MediaFolder)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const folder = folderRaw as MediaFolder;
  if (getMediaFolderVisibility(folder) === "protected") {
    const access = await canReadProtectedMedia(folder, fileName);
    if (!access.allowed) return access.response;
  }

  let content: Buffer;
  try {
    content = await readMediaFile(folder, fileName);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(fileName).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const cacheControl = getMediaFolderVisibility(folder) === "protected"
    ? "private, max-age=300"
    : "public, max-age=31536000, immutable";

  return new NextResponse(new Uint8Array(content), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "X-Uploads-Route": "api-runtime",
    },
  });
}
