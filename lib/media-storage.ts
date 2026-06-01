import { promises as fs } from "fs";
import path from "path";

export type MediaFolder = "avatars" | "transformations" | "meals" | "checkins" | "movement-videos";

type SaveMediaFileInput = {
  folder: MediaFolder;
  fileName: string;
  buffer: Buffer;
  cacheBust?: boolean;
};

function getStorageDriver() {
  return process.env.MEDIA_STORAGE_DRIVER || "local";
}

function assertSafeFileName(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    throw new Error(`Unsafe media filename: ${fileName}`);
  }
}

function localUploadsDir(folder: MediaFolder) {
  return path.join(process.cwd(), "public", "uploads", folder);
}

function mediaUrl(folder: MediaFolder, fileName: string, cacheBust?: boolean) {
  const baseUrl = process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const relativeUrl = `/uploads/${folder}/${fileName}`;
  const url = baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
  return cacheBust ? `${url}?v=${Date.now()}` : url;
}

export async function saveMediaFile({ folder, fileName, buffer, cacheBust = false }: SaveMediaFileInput) {
  assertSafeFileName(fileName);

  const driver = getStorageDriver();
  if (driver !== "local") {
    throw new Error(`Unsupported media storage driver: ${driver}`);
  }

  const uploadsDir = localUploadsDir(folder);
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, fileName), buffer);

  return {
    url: mediaUrl(folder, fileName, cacheBust),
    key: `${folder}/${fileName}`,
  };
}

export async function listMediaFiles(folder: MediaFolder) {
  const driver = getStorageDriver();
  if (driver !== "local") {
    throw new Error(`Unsupported media storage driver: ${driver}`);
  }

  return fs.readdir(localUploadsDir(folder)).catch(() => [] as string[]);
}

export async function deleteMediaFile(folder: MediaFolder, fileName: string) {
  assertSafeFileName(fileName);

  const driver = getStorageDriver();
  if (driver !== "local") {
    throw new Error(`Unsupported media storage driver: ${driver}`);
  }

  await fs.unlink(path.join(localUploadsDir(folder), fileName));
}

export function extractMediaFileName(url: string | null | undefined) {
  if (!url) return null;
  const pathname = url.split("?")[0] ?? "";
  const fileName = pathname.split("/").pop();
  return fileName && /^[a-zA-Z0-9._-]+$/.test(fileName) ? fileName : null;
}
