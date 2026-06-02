export const RTC_PROVIDER_OPTIONS = [
  { value: "custom_rtc", label: "Custom RTC" },
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
] as const;

export const RTC_CALL_STATUS_OPTIONS = [
  { value: "NOT_CONFIGURED", label: "Hazir degil" },
  { value: "READY", label: "Hazir" },
  { value: "LIVE", label: "Canli" },
  { value: "ENDED", label: "Tamamlandi" },
] as const;

export type RtcProviderValue = (typeof RTC_PROVIDER_OPTIONS)[number]["value"];
export type RtcCallStatusValue = (typeof RTC_CALL_STATUS_OPTIONS)[number]["value"];

export function getRtcProviderLabel(value?: string | null) {
  return RTC_PROVIDER_OPTIONS.find((item) => item.value === value)?.label ?? "Belirlenmedi";
}

export function getRtcCallStatusMeta(value?: string | null) {
  const normalized = RTC_CALL_STATUS_OPTIONS.find((item) => item.value === value)?.value ?? "NOT_CONFIGURED";

  if (normalized === "READY") {
    return { label: "Hazir", className: "bg-sky-100 text-sky-700" };
  }
  if (normalized === "LIVE") {
    return { label: "Canli", className: "bg-emerald-100 text-emerald-700" };
  }
  if (normalized === "ENDED") {
    return { label: "Tamamlandi", className: "bg-slate-100 text-slate-700" };
  }

  return { label: "Hazir degil", className: "bg-amber-100 text-amber-700" };
}
