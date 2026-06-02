export const MEDIA_UPLOAD_LIMITS = {
  avatar: {
    maxSizeBytes: 2 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  nutritionPhoto: {
    maxSizeBytes: 8 * 1024 * 1024,
    allowedTypes: ["image/*", "jpg", "jpeg", "png", "webp", "heic", "heif", "gif"],
  },
  bodyCheckinPhoto: {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  },
  movementVideo: {
    maxSizeBytes: 20 * 1024 * 1024,
    allowedTypes: ["video/webm", "video/mp4"],
    maxDurationSeconds: 30,
  },
  formAnalysisVideo: {
    maxSizeBytes: 20 * 1024 * 1024,
    allowedTypes: ["video/webm", "video/mp4", "video/quicktime"],
    maxDurationSeconds: 90,
  },
} as const;

export function bytesToMb(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}
