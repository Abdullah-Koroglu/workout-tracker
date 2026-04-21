import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { RoleNavShell } from "@/components/shared/RoleNavShell";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/coach/dashboard");

  return (
    <RoleNavShell role="CLIENT" userName={session.user.name}>
      <div className="space-y-4">{children}</div>
    </RoleNavShell>
  );
}
