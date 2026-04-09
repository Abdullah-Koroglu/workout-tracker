import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function TemplatesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-8 w-40" />
        <LoadingSkeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-lg shadow dark:bg-gray-800 space-y-3">
            <LoadingSkeleton className="h-6 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-3/4" />
            <div className="pt-2 flex gap-2">
              <LoadingSkeleton className="h-8 w-24" />
              <LoadingSkeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
