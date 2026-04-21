import { redirect } from "next/navigation";

import { MessagesClient } from "@/components/shared/MessagesClient";
import { auth } from "@/lib/auth";

export default async function ClientMessagesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/coach/messages");
  }

  return <MessagesClient currentUserId={session.user.id} />;
}
