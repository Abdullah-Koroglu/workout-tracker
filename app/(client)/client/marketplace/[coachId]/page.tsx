import { redirect } from "next/navigation";

export default async function MarketplaceCoachRedirect({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;
  redirect(`/client/coaches/${coachId}`);
}
