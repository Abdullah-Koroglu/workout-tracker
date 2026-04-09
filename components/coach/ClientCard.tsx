import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClientCard({
  id,
  name,
  email
}: {
  id: string;
  name: string;
  email: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{email}</p>
        <div className="mt-3 flex gap-3 text-sm">
          <Link href={`/coach/clients/${id}`} className="text-primary underline">
            Detay
          </Link>
          <Link href={`/coach/clients/${id}/progress`} className="text-primary underline">
            İlerleme
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
