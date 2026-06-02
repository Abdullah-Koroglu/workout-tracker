import { MEDIA_UPLOAD_LIMITS, bytesToMb } from "@/lib/media-upload-limits";

type ReadinessTone = "good" | "warn" | "bad";

export type MediaDeploymentCheck = {
  key: string;
  label: string;
  status: "ready" | "partial" | "missing";
  tone: ReadinessTone;
  detail: string;
};

export type MediaDeploymentReadiness = {
  status: "ready" | "partial" | "missing";
  driver: "local" | "s3";
  publicBaseUrl: string | null;
  recommendedBodySizeMb: number;
  checks: MediaDeploymentCheck[];
  uploadLimits: Array<{
    label: string;
    maxSizeMb: number;
    allowedTypes: string[];
    maxDurationSeconds?: number;
  }>;
};

function getDriver() {
  return (process.env.MEDIA_STORAGE_DRIVER === "s3" ? "s3" : "local") as "local" | "s3";
}

function getStatusFromChecks(checks: MediaDeploymentCheck[]): MediaDeploymentReadiness["status"] {
  if (checks.some((check) => check.status === "missing")) return "missing";
  if (checks.some((check) => check.status === "partial")) return "partial";
  return "ready";
}

export function getMediaDeploymentReadiness(): MediaDeploymentReadiness {
  const driver = getDriver();
  const publicBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL?.trim() || null;
  const allowLocalInProduction = process.env.MEDIA_ALLOW_LOCAL_STORAGE_IN_PRODUCTION === "true";
  const isProduction = process.env.NODE_ENV === "production";
  const missingS3Keys = [
    "MEDIA_S3_BUCKET",
    "MEDIA_S3_ENDPOINT",
    "MEDIA_S3_ACCESS_KEY_ID",
    "MEDIA_S3_SECRET_ACCESS_KEY",
  ].filter((key) => !process.env[key]);

  const checks: MediaDeploymentCheck[] = [
    driver === "s3"
      ? {
          key: "driver",
          label: "Storage driver",
          status: "ready",
          tone: "good",
          detail: "S3/R2 driver aktif. Deploy sonrasi dosyalar instance disinda kalici saklanir.",
        }
      : {
          key: "driver",
          label: "Storage driver",
          status: isProduction ? "missing" : "partial",
          tone: isProduction ? "bad" : "warn",
          detail: isProduction
            ? "Production ortaminda local driver guvenli degil. S3/R2 gecisi gerekli."
            : "Gelistirme ortami local driver kullaniyor. Launch oncesi S3/R2'e gecis planli kalmali.",
        },
    publicBaseUrl
      ? {
          key: "cdn",
          label: "Public media base URL",
          status: "ready",
          tone: "good",
          detail: `Public medya ${publicBaseUrl} uzerinden servis edilecek.`,
        }
      : {
          key: "cdn",
          label: "Public media base URL",
          status: driver === "s3" ? "partial" : "missing",
          tone: driver === "s3" ? "warn" : "bad",
          detail:
            driver === "s3"
              ? "S3/R2 aktif ama MEDIA_PUBLIC_BASE_URL bos. CDN veya public asset host tanimlanmali."
              : "Marketplace gorselleri icin public base URL / CDN tanimi eksik.",
        },
    missingS3Keys.length === 0
      ? {
          key: "s3-config",
          label: "S3/R2 credentials",
          status: driver === "s3" ? "ready" : "partial",
          tone: driver === "s3" ? "good" : "warn",
          detail: driver === "s3" ? "Gerekli bucket ve kimlik bilgileri tanimli." : "S3/R2 kimlik bilgileri tanimli; driver gecisi yapildiginda hazir.",
        }
      : {
          key: "s3-config",
          label: "S3/R2 credentials",
          status: driver === "s3" ? "missing" : "partial",
          tone: driver === "s3" ? "bad" : "warn",
          detail:
            driver === "s3"
              ? `Eksik degiskenler: ${missingS3Keys.join(", ")}`
              : `S3/R2 gecisi icin hala gerekli degiskenler eksik: ${missingS3Keys.join(", ")}`,
        },
    {
      key: "protected-media",
      label: "Protected media policy",
      status: "ready",
      tone: "good",
      detail: "Meal, body check-in ve video dosyalari korumali /api/uploads rotasindan servis ediliyor.",
    },
    {
      key: "local-override",
      label: "Local production override",
      status: !isProduction || !allowLocalInProduction ? "ready" : "partial",
      tone: !isProduction || !allowLocalInProduction ? "good" : "warn",
      detail:
        allowLocalInProduction
          ? "MEDIA_ALLOW_LOCAL_STORAGE_IN_PRODUCTION=true. Bu sadece gecici internal ortamlar icin kullanilmali."
          : "Production'da local storage override kapali.",
    },
  ];

  const recommendedBodySizeMb = bytesToMb(
    Math.max(
      MEDIA_UPLOAD_LIMITS.movementVideo.maxSizeBytes,
      MEDIA_UPLOAD_LIMITS.formAnalysisVideo.maxSizeBytes
    )
  );

  return {
    status: getStatusFromChecks(checks),
    driver,
    publicBaseUrl,
    recommendedBodySizeMb,
    checks,
    uploadLimits: [
      {
        label: "Coach avatar",
        maxSizeMb: bytesToMb(MEDIA_UPLOAD_LIMITS.avatar.maxSizeBytes),
        allowedTypes: [...MEDIA_UPLOAD_LIMITS.avatar.allowedTypes],
      },
      {
        label: "Nutrition photo",
        maxSizeMb: bytesToMb(MEDIA_UPLOAD_LIMITS.nutritionPhoto.maxSizeBytes),
        allowedTypes: [...MEDIA_UPLOAD_LIMITS.nutritionPhoto.allowedTypes],
      },
      {
        label: "Body check-in photo",
        maxSizeMb: bytesToMb(MEDIA_UPLOAD_LIMITS.bodyCheckinPhoto.maxSizeBytes),
        allowedTypes: [...MEDIA_UPLOAD_LIMITS.bodyCheckinPhoto.allowedTypes],
      },
      {
        label: "Movement video",
        maxSizeMb: bytesToMb(MEDIA_UPLOAD_LIMITS.movementVideo.maxSizeBytes),
        allowedTypes: [...MEDIA_UPLOAD_LIMITS.movementVideo.allowedTypes],
        maxDurationSeconds: MEDIA_UPLOAD_LIMITS.movementVideo.maxDurationSeconds,
      },
      {
        label: "Form analysis video",
        maxSizeMb: bytesToMb(MEDIA_UPLOAD_LIMITS.formAnalysisVideo.maxSizeBytes),
        allowedTypes: [...MEDIA_UPLOAD_LIMITS.formAnalysisVideo.allowedTypes],
        maxDurationSeconds: MEDIA_UPLOAD_LIMITS.formAnalysisVideo.maxDurationSeconds,
      },
    ],
  };
}
