export function ExerciseRow({
  name,
  type,
  meta,
  action
}: {
  name: string;
  type: "WEIGHT" | "CARDIO";
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{type}</p>
      </div>
      <div className="flex items-center gap-3">
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        {action}
      </div>
    </div>
  );
}
