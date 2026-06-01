import { mediaFileExists, type MediaFolder } from "@/lib/media-storage";

const MEDIA_FOLDERS = new Set<MediaFolder>(["avatars", "transformations", "meals", "checkins", "movement-videos"]);

function parseUploadUrl(uploadUrl: string): { folder: MediaFolder; fileName: string } | null {
  const [cleanPath] = uploadUrl.split(/[?#]/, 1);
  const normalized = cleanPath.replace(/^\/api\/uploads\//, "/uploads/");
  if (!normalized.startsWith("/uploads/")) return null;

  const [, , folder, fileName] = normalized.split("/");
  if (!MEDIA_FOLDERS.has(folder as MediaFolder)) return null;
  if (!fileName || !/^[a-zA-Z0-9._-]+$/.test(fileName)) return null;

  return { folder: folder as MediaFolder, fileName };
}

export async function uploadUrlExists(uploadUrl: string | null): Promise<boolean> {
  if (!uploadUrl) return false;

  const parsed = parseUploadUrl(uploadUrl);
  if (!parsed) return false;

  return mediaFileExists(parsed.folder, parsed.fileName);
}
