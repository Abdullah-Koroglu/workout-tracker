import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { TestDateSelector } from "@/components/coach/TestDateSelector";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "COACH") redirect("/client/dashboard");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-gradient-to-r from-slate-50 to-emerald-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Coach Header</p>
            <h1 className="text-xl font-black text-slate-900">Gün ve Yönetim Kontrolleri</h1>
          </div>
        </div>
        <TestDateSelector inline />
      </div>

      {children}

      <TestDateSelector />
    </div>
  );
}
