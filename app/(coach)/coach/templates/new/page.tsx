import { TemplateForm } from "@/components/coach/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Yeni Template</h1>
      <TemplateForm endpoint="/api/coach/templates" />
    </div>
  );
}
