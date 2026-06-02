import Link from "next/link";

import { AppLocale, buildLocalizedPath, defaultLocale } from "@/lib/i18n";

const LABELS: Record<AppLocale, string> = {
  tr: "TR",
  en: "EN",
};

export function LocaleToggle({
  pathname,
  locale,
  params,
  tone = "dark",
}: {
  pathname: string;
  locale: AppLocale;
  params?: Record<string, string | undefined | null>;
  tone?: "dark" | "light";
}) {
  const containerClass =
    tone === "dark"
      ? "border border-white/10 bg-white/5 text-white/70"
      : "border border-slate-200 bg-white text-slate-500";

  const activeClass =
    tone === "dark"
      ? "bg-white text-slate-900 shadow-sm"
      : "bg-slate-900 text-white shadow-sm";

  const inactiveClass =
    tone === "dark"
      ? "text-white/70 hover:text-white"
      : "text-slate-500 hover:text-slate-900";

  return (
    <div className={`inline-flex items-center gap-1 rounded-xl p-1 ${containerClass}`}>
      {(["tr", "en"] as const).map((item) => {
        const href = buildLocalizedPath(pathname, item, params);
        const isActive = (locale ?? defaultLocale) === item;

        return (
          <Link
            key={item}
            href={href}
            className={`inline-flex h-8 min-w-10 items-center justify-center rounded-lg px-3 text-xs font-black transition ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            {LABELS[item]}
          </Link>
        );
      })}
    </div>
  );
}
