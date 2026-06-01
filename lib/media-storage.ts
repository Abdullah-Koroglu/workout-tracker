import { promises as fs } from "fs";
import crypto from "crypto";
import path from "path";

export type MediaFolder = "avatars" | "transformations" | "meals" | "checkins" | "movement-videos";

type SaveMediaFileInput = {
  folder: MediaFolder;
  fileName: string;
  buffer: Buffer;
  cacheBust?: boolean;
};

type StorageDriver = "local" | "s3";

type S3Config = {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function getStorageDriver(): StorageDriver {
  const driver = process.env.MEDIA_STORAGE_DRIVER || "local";
  if (driver === "local" || driver === "s3") return driver;
  throw new Error(`Unsupported media storage driver: ${driver}`);
}

function assertLocalStorageAllowed() {
  if (process.env.NODE_ENV === "production" && process.env.MEDIA_ALLOW_LOCAL_STORAGE_IN_PRODUCTION !== "true") {
    throw new Error("MEDIA_STORAGE_DRIVER=local is not allowed in production. Configure MEDIA_STORAGE_DRIVER=s3.");
  }
}

function getS3Config(): S3Config {
  const config = {
    bucket: process.env.MEDIA_S3_BUCKET,
    region: process.env.MEDIA_S3_REGION || "auto",
    endpoint: process.env.MEDIA_S3_ENDPOINT,
    accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing S3 media storage config: ${missing.join(", ")}`);
  }

  return config as S3Config;
}

function assertSafeFileName(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    throw new Error(`Unsafe media filename: ${fileName}`);
  }
}

function localUploadsDir(folder: MediaFolder) {
  return path.join(process.cwd(), "public", "uploads", folder);
}

function mediaKey(folder: MediaFolder, fileName: string) {
  return `uploads/${folder}/${fileName}`;
}

export function getMediaFolderVisibility(folder: MediaFolder): "public" | "protected" {
  if (folder === "avatars" || folder === "transformations") return "public";
  return "protected";
}

function mediaUrl(folder: MediaFolder, fileName: string, cacheBust?: boolean) {
  const visibility = getMediaFolderVisibility(folder);
  const baseUrl = visibility === "public" ? process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, "") : "";
  const relativeUrl = visibility === "protected"
    ? `/api/${mediaKey(folder, fileName)}`
    : `/${mediaKey(folder, fileName)}`;
  const url = baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
  return cacheBust ? `${url}?v=${Date.now()}` : url;
}

function sha256Hex(input: string | Buffer) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

function encodePath(pathname: string) {
  return pathname
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDateStamp(date: Date) {
  return toAmzDate(date).slice(0, 8);
}

function signingKey(secretAccessKey: string, dateStamp: string, region: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

async function s3Request(method: "GET" | "PUT" | "DELETE", key: string, body?: Buffer, query = "") {
  const config = getS3Config();
  const endpoint = config.endpoint.replace(/\/$/, "");
  const endpointUrl = new URL(endpoint);
  const host = endpointUrl.host;
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = toDateStamp(now);
  const payloadHash = sha256Hex(body ?? "");
  const canonicalUri = encodePath(`/${config.bucket}/${key}`);
  const canonicalQueryString = query;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = hmacHex(signingKey(config.secretAccessKey, dateStamp, config.region), stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `${endpoint}${canonicalUri}${query ? `?${query}` : ""}`;
  const requestBody = body ? new Uint8Array(body) : undefined;
  const response = await fetch(url, {
    method,
    body: requestBody,
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`S3 media request failed: ${method} ${key} ${response.status} ${text}`);
  }

  return response;
}

export async function saveMediaFile({ folder, fileName, buffer, cacheBust = false }: SaveMediaFileInput) {
  assertSafeFileName(fileName);

  const driver = getStorageDriver();
  const key = mediaKey(folder, fileName);

  if (driver === "local") {
    assertLocalStorageAllowed();
    const uploadsDir = localUploadsDir(folder);
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, fileName), buffer);
  } else {
    await s3Request("PUT", key, buffer);
  }

  return {
    url: mediaUrl(folder, fileName, cacheBust),
    key,
  };
}

export async function listMediaFiles(folder: MediaFolder) {
  const driver = getStorageDriver();
  if (driver === "local") {
    assertLocalStorageAllowed();
    return fs.readdir(localUploadsDir(folder)).catch(() => [] as string[]);
  }

  const prefix = `${mediaKey(folder, "")}`;
  const response = await s3Request("GET", "", undefined, `list-type=2&prefix=${encodeURIComponent(prefix)}`);
  const xml = await response.text();
  return Array.from(xml.matchAll(/<Key>([^<]+)<\/Key>/g))
    .map((match) => match[1])
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length))
    .filter(Boolean);
}

export async function deleteMediaFile(folder: MediaFolder, fileName: string) {
  assertSafeFileName(fileName);

  const driver = getStorageDriver();
  if (driver === "local") {
    assertLocalStorageAllowed();
    await fs.unlink(path.join(localUploadsDir(folder), fileName));
    return;
  }

  await s3Request("DELETE", mediaKey(folder, fileName));
}

export async function readMediaFile(folder: MediaFolder, fileName: string) {
  assertSafeFileName(fileName);

  const driver = getStorageDriver();
  if (driver === "local") {
    assertLocalStorageAllowed();
    return fs.readFile(path.join(localUploadsDir(folder), fileName));
  }

  const response = await s3Request("GET", mediaKey(folder, fileName));
  return Buffer.from(await response.arrayBuffer());
}

export async function mediaFileExists(folder: MediaFolder, fileName: string) {
  assertSafeFileName(fileName);

  try {
    if (getStorageDriver() === "local") {
      assertLocalStorageAllowed();
      await fs.access(path.join(localUploadsDir(folder), fileName));
      return true;
    }

    await s3Request("GET", mediaKey(folder, fileName));
    return true;
  } catch {
    return false;
  }
}

export function extractMediaFileName(url: string | null | undefined) {
  if (!url) return null;
  const pathname = url.split("?")[0] ?? "";
  const fileName = pathname.split("/").pop();
  return fileName && /^[a-zA-Z0-9._-]+$/.test(fileName) ? fileName : null;
}
