import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function MessagesPage({
  searchParams
}: {
  searchParams: Promise<{ withUserId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const withUserId = params.withUserId ? `?withUserId=${encodeURIComponent(params.withUserId)}` : "";
  const scopedPath = session.user.role === "COACH" ? "/coach/messages" : "/client/messages";
  redirect(`${scopedPath}${withUserId}`);
}
