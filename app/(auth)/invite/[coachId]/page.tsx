import { Suspense } from "react";
import { InviteContent } from "./InviteContent";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div>}>
      <InviteContent coachId={coachId} />
    </Suspense>
  );
}
