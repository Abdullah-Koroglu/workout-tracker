import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function ExercisesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-8 w-40" />
        <LoadingSkeleton className="h-10 w-32" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <LoadingSkeleton className="h-6 w-56 mb-2" />
            <LoadingSkeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
