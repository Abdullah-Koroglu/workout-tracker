import { Suspense } from "react";
import ClientCoachesContent from "./content";

export const dynamic = "force-dynamic";

export default function ClientCoachesPage() {
  return (
    <Suspense>
      <ClientCoachesContent />
    </Suspense>
  );
};
