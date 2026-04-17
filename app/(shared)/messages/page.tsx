import { redirect } from "next/navigation";

import { MessagesClient } from "@/components/shared/MessagesClient";
import { auth } from "@/lib/auth";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <MessagesClient currentUserId={session.user.id} currentUserRole={session.user.role} />;
}
