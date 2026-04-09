"use client";

import { useState } from "react";
import { ClientWorkoutFlow } from "@/components/client/ClientWorkoutFlow";
import { StartConfirmationPage } from "@/components/client/StartConfirmationPage";

export function StartWorkoutPageClient({ assignmentId }: { assignmentId: string }) {
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <StartConfirmationPage
        assignmentId={assignmentId}
        onConfirm={() => setConfirmed(true)}
      />
    );
  }

  return <ClientWorkoutFlow assignmentId={assignmentId} />;
}
