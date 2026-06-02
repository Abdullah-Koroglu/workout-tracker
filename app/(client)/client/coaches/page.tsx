import { Suspense } from "react";
import ClientCoachesContent from "./content";

export const dynamic = "force-dynamic";

export default async function ClientCoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;

  return (
    <Suspense>
      <ClientCoachesContent lang={lang} />
    </Suspense>
  );
};
