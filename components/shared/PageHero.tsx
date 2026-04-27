import type { LucideIcon } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────── */

export type HeroGlowColor = "orange" | "green" | "amber" | "blue" | "navy";

export type HeroStatPill = {
  label: string;
  value: string | number;
  color: string;
  bg: string;
  icon?: LucideIcon;
};

export type HeroStatBox = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

export type HeroAvatar = {
  initials: string;
  variant?: "orange" | "navy";
};

export type HeroBadge = {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon?: LucideIcon;
};

export type PageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  variant?: "dark" | "navy";
  glowColor?: HeroGlowColor;
  stats?: HeroStatPill[];
  statBoxes?: HeroStatBox[];
  avatar?: HeroAvatar;
  badge?: HeroBadge;
  children?: React.ReactNode;
};

/* ── Gradient backgrounds ───────────────────────────────────────── */
const BG: Record<"dark" | "navy", string> = {
  dark: "linear-gradient(160deg, #1E293B 0%, #0F172A 55%, #1A2A42 100%)",
  navy: "linear-gradient(160deg, #1A365D 0%, #2D4A7A 50%, #1A2D4A 100%)",
};

const AVATAR_STYLE: Record<"orange" | "navy", React.CSSProperties> = {
  orange: {
    background: "linear-gradient(135deg, #FB923C, #EA580C)",
    boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
  },
  navy: {
    background: "linear-gradient(135deg, #2D4A7A, #1A365D)",
    boxShadow: "0 4px 16px rgba(26,54,93,0.6)",
    border: "2px solid rgba(249,115,22,0.35)",
  },
};

/* ── Glassmorphism stat box ─────────────────────────────────────── */
function GlassBox({
  label,
  value,
  sub,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accentColor?: string;
}) {
  return (
    <div
      className="flex flex-1 flex-col rounded-[14px] px-2.5 py-3 text-center"
      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {Icon && (
        <Icon
          className="mx-auto mb-1.5 h-3.5 w-3.5"
          style={{ color: accentColor ?? "rgba(255,255,255,0.55)" }}
        />
      )}
      <span
        className="block text-[20px] font-extrabold leading-none tracking-tight"
        style={{ color: accentColor ?? "#fff" }}
      >
        {value}
      </span>
      <span
        className="mt-1 block text-[10px] font-semibold leading-tight"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {label}
      </span>
      {sub && (
        <span
          className="mt-0.5 block text-[9px]"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────── */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  variant = "dark",
  stats,
  statBoxes,
  avatar,
  badge,
  children,
}: PageHeroProps) {
  const hasBottomRow = (stats && stats.length > 0) || (statBoxes && statBoxes.length > 0);

  return (
    <div
      className="relative overflow-hidden rounded-[18px]"
      style={{ background: BG[variant] }}
    >
      {/* ── Decorative circles (design-language style) ── */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full sm:-right-10 sm:-top-10 sm:h-48 sm:w-48"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />
      {/* Small accent dot near top-left */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-px w-32 -translate-x-1/2"
        style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent)" }}
      />

      {/* ── Inner content ── */}
      <div className="relative z-10 px-4 py-5 sm:px-5 sm:py-6">

        {/* ── Top row: avatar + text  /  statBoxes ── */}
        <div
          className={[
            "flex gap-3",
            statBoxes ? "flex-col sm:flex-row sm:items-start sm:justify-between" : "flex-col",
          ].join(" ")}
        >
          {/* Left: avatar + text block */}
          <div className={["flex gap-3", avatar ? "items-start" : "items-start flex-col"].join(" ")}>

            {/* Avatar */}
            {avatar && (
              <div
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white sm:h-[60px] sm:w-[60px]"
                style={AVATAR_STYLE[avatar.variant ?? "orange"]}
              >
                {avatar.initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              {/* Badge */}
              {badge && (
                <span
                  className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                >
                  {badge.icon && <badge.icon className="h-3 w-3" />}
                  {badge.label}
                </span>
              )}

              {/* Eyebrow */}
              {eyebrow && (
                <span
                  className="mb-1 block text-[10px] font-black uppercase tracking-[0.22em]"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {eyebrow}
                </span>
              )}

              {/* Title */}
              <h1
                className="text-xl font-black leading-tight tracking-tight text-white sm:text-2xl md:text-[26px]"
                style={{ letterSpacing: "-0.3px" }}
              >
                {title}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {subtitle}
                </p>
              )}

              {/* Extra slot */}
              {children && <div className="mt-3">{children}</div>}
            </div>
          </div>

          {/* Right: statBoxes as glassmorphism row (desktop) */}
          {statBoxes && statBoxes.length > 0 && (
            <div className="flex gap-2 sm:flex-shrink-0 sm:gap-2.5">
              {statBoxes.map(({ label, value, icon }) => (
                <GlassBox key={label} label={label} value={value} icon={icon} />
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom: stats row as glassmorphism boxes ── */}
        {stats && stats.length > 0 && (
          <div className={["flex gap-2.5", hasBottomRow ? "mt-4" : ""].join(" ")}>
            {stats.map(({ label, value, color, icon }) => (
              <GlassBox
                key={label}
                label={label}
                value={value}
                icon={icon}
                accentColor={color}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom accent line ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.3), transparent)" }}
      />
    </div>
  );
}
