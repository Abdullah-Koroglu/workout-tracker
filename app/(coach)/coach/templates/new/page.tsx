import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { TemplateForm } from "@/components/coach/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/coach/templates"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Sablonlara geri don
      </Link>
      <h1 className="text-2xl font-bold">Yeni Template</h1>
      <TemplateForm endpoint="/api/coach/templates" />
    </div>
  );
}
