import { Suspense } from "react";
import { RegisterContent } from "./RegisterContent";

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
