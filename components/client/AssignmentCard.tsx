import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AssignmentCard({
  assignmentId,
  templateName,
  coachName
}: {
  assignmentId: string;
  templateName: string;
  coachName: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{templateName}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Coach: {coachName}</p>
        <Link href={`/client/workout/${assignmentId}/start`} className="mt-3 inline-block text-sm text-primary underline">
          Antrenmanı Başlat
        </Link>
      </CardContent>
    </Card>
  );
}
