import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { TemplateForm } from "@/components/coach/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="space-y-5 pb-[calc(var(--app-mobile-nav-height)+2rem)] md:pb-10">
      <Link
        href="/coach/templates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Antrenmanlara geri dön
      </Link>

      <div className="app-panel rounded-2xl border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Antrenman Yönetimi
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          Yeni Antrenman
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Egzersizleri sürükle-bırak ile sırala, kardiyo protokolleri ekle.
        </p>
      </div>

      <TemplateForm endpoint="/api/coach/templates" />
    </div>
  );
}
