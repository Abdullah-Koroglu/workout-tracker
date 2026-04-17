import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { TestDateSelector } from "@/components/coach/TestDateSelector";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "COACH") redirect("/client/dashboard");

  return (
    <div className="space-y-4">
      {children}
      <TestDateSelector />
    </div>
  );
}
