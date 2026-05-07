import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function ChatWithCoachPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { coachId } = await params;
  const targetPath = session.user.role === "COACH" ? "/coach/messages" : "/client/messages";

  redirect(`${targetPath}?withUserId=${encodeURIComponent(coachId)}`);
}
