import { StartWorkoutPageClient } from "@/components/client/StartWorkoutPageClient";

export default async function StartWorkoutPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;

  return <StartWorkoutPageClient assignmentId={assignmentId} />;
}
