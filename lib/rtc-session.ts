export const RTC_PROVIDER_OPTIONS = [
  { value: "link", label: "Link RTC" },
] as const;

export const SESSION_CALL_MODE_OPTIONS = [
  { value: "AUDIO", label: "Sesli gorusme" },
  { value: "VIDEO", label: "Goruntulu gorusme" },
] as const;

export const SESSION_CALL_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Planlandi" },
  { value: "PROVISIONING", label: "Hazirlaniyor" },
  { value: "READY", label: "Hazir" },
  { value: "LIVE", label: "Canli" },
  { value: "ENDED", label: "Tamamlandi" },
  { value: "FAILED", label: "Hata" },
] as const;

export const SESSION_RECORDING_STATUS_OPTIONS = [
  { value: "NOT_REQUESTED", label: "Kayit yok" },
  { value: "PENDING", label: "Kayit hazirlaniyor" },
  { value: "READY", label: "Kayit hazir" },
  { value: "FAILED", label: "Kayit hatasi" },
] as const;

export type RtcProviderValue = (typeof RTC_PROVIDER_OPTIONS)[number]["value"];
export type SessionCallModeValue = (typeof SESSION_CALL_MODE_OPTIONS)[number]["value"];
export type SessionCallStatusValue = (typeof SESSION_CALL_STATUS_OPTIONS)[number]["value"];
export type SessionRecordingStatusValue = (typeof SESSION_RECORDING_STATUS_OPTIONS)[number]["value"];

export function getRtcProviderLabel(value?: string | null) {
  return RTC_PROVIDER_OPTIONS.find((item) => item.value === value)?.label ?? "Belirlenmedi";
}

export function getSessionCallModeLabel(value?: string | null) {
  return SESSION_CALL_MODE_OPTIONS.find((item) => item.value === value)?.label ?? "Goruntulu gorusme";
}

export function getSessionCallStatusMeta(value?: string | null) {
  const normalized = SESSION_CALL_STATUS_OPTIONS.find((item) => item.value === value)?.value ?? "SCHEDULED";

  switch (normalized) {
    case "PROVISIONING":
      return { label: "Hazirlaniyor", className: "bg-amber-100 text-amber-700" };
    case "READY":
      return { label: "Hazir", className: "bg-sky-100 text-sky-700" };
    case "LIVE":
      return { label: "Canli", className: "bg-emerald-100 text-emerald-700" };
    case "ENDED":
      return { label: "Tamamlandi", className: "bg-slate-100 text-slate-700" };
    case "FAILED":
      return { label: "Hata", className: "bg-rose-100 text-rose-700" };
    default:
      return { label: "Planlandi", className: "bg-indigo-100 text-indigo-700" };
  }
}

export function getRecordingStatusLabel(value?: string | null) {
  return SESSION_RECORDING_STATUS_OPTIONS.find((item) => item.value === value)?.label ?? "Kayit yok";
}

export function isJoinWindowOpen(scheduledFor: string | Date, joinWindowMinutes = 10) {
  const sessionTime = new Date(scheduledFor).getTime();
  const now = Date.now();
  const windowStart = sessionTime - joinWindowMinutes * 60 * 1000;
  return now >= windowStart;
}
