import { Suspense } from "react";
import { CompareContent } from "./CompareContent";

export default function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-100" />}>
      <ComparePageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function ComparePageInner({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const coachIds = (ids ?? "").split(",").filter(Boolean).slice(0, 3);
  return <CompareContent coachIds={coachIds} />;
}
