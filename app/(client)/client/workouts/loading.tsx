import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function ClientWorkoutsLoading() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton className="h-8 w-48" />

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-lg shadow dark:bg-gray-800 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-6 w-56" />
                <LoadingSkeleton className="h-4 w-40" />
              </div>
              <div className="flex gap-4">
                <LoadingSkeleton className="h-6 w-12" />
                <LoadingSkeleton className="h-6 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
