import { Role } from "@prisma/client";

export function RoleBadge({ role }: { role: Role }) {
  const className =
    role === "COACH"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{role}</span>;
}
