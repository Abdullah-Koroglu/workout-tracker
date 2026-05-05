"use client";

import { FormEvent, useEffect, useState } from "react";
import { Dumbbell, Plus, StretchHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotificationContext } from "@/contexts/NotificationContext";

type MobilityMovement = {
  id: string;
  name: string;
  videoUrl: string | null;
  description: string | null;
  _count?: { routineMovements: number };
};

type MobilityRoutine = {
  id: string;
  name: string;
  description: string | null;
  movements: Array<{
    id: string;
    order: number;
    durationSeconds: number;
    movement: {
      id: string;
      name: string;
      videoUrl: string | null;
    };
  }>;
};

type RoutineDraftItem = {
  movementId: string;
  durationSeconds: number;
};

export default function CoachMobilityPage() {
  const { push } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<MobilityMovement[]>([]);
  const [routines, setRoutines] = useState<MobilityRoutine[]>([]);

  const [movementName, setMovementName] = useState("");
  const [movementVideoUrl, setMovementVideoUrl] = useState("");
  const [movementDescription, setMovementDescription] = useState("");

  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [routineDraft, setRoutineDraft] = useState<RoutineDraftItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementRes, routineRes] = await Promise.all([
        fetch("/api/coach/mobility/movements"),
        fetch("/api/coach/mobility/routines"),
      ]);

      const movementData = await movementRes.json().catch(() => ({}));
      const routineData = await routineRes.json().catch(() => ({}));

      setMovements(movementData.movements ?? []);
      setRoutines(routineData.routines ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const createMovement = async (event: FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/coach/mobility/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: movementName,
        videoUrl: movementVideoUrl || null,
        description: movementDescription || null,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      push(data.error || "Hareket oluşturulamadı.");
      return;
    }

    setMovementName("");
    setMovementVideoUrl("");
    setMovementDescription("");
    push("Mobilite hareketi oluşturuldu.");
    await loadData();
  };

  const removeMovement = async (id: string) => {
    const response = await fetch(`/api/coach/mobility/movements/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      push(data.error || "Hareket silinemedi.");
      return;
    }

    push("Mobilite hareketi silindi.");
    await loadData();
  };

  const addRoutineDraftItem = () => {
    if (movements.length === 0) return;

    const firstMovementId = movements[0].id;
    setRoutineDraft((prev) => [...prev, { movementId: firstMovementId, durationSeconds: 45 }]);
  };

  const createRoutine = async (event: FormEvent) => {
    event.preventDefault();

    if (routineDraft.length === 0) {
      push("Rutin için en az 1 hareket seçin.");
      return;
    }

    const response = await fetch("/api/coach/mobility/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: routineName,
        description: routineDescription || null,
        movements: routineDraft.map((item, index) => ({
          movementId: item.movementId,
          durationSeconds: item.durationSeconds,
          order: index,
        })),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      push(data.error || "Rutin oluşturulamadı.");
      return;
    }

    setRoutineName("");
    setRoutineDescription("");
    setRoutineDraft([]);
    push("Mobilite rutini oluşturuldu.");
    await loadData();
  };

  const removeRoutine = async (id: string) => {
    const response = await fetch(`/api/coach/mobility/routines/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      push(data.error || "Rutin silinemedi.");
      return;
    }

    push("Mobilite rutini silindi.");
    await loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">Mobility Library</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bu ekran egzersiz modülünden bağımsızdır ve sadece mobilite hareket/rutin yönetimi için kullanılır.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
          <StretchHorizontal className="h-5 w-5" /> Hareketler
        </h2>
        <form onSubmit={createMovement} className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Hareket adı"
            value={movementName}
            onChange={(event) => setMovementName(event.target.value)}
            required
          />
          <Input
            placeholder="Video URL (opsiyonel)"
            value={movementVideoUrl}
            onChange={(event) => setMovementVideoUrl(event.target.value)}
          />
          <Input
            placeholder="Açıklama (opsiyonel)"
            value={movementDescription}
            onChange={(event) => setMovementDescription(event.target.value)}
          />
          <Button type="submit">Hareket Ekle</Button>
        </form>

        <div className="mt-4 space-y-2">
          {movements.map((movement) => (
            <div key={movement.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="font-semibold text-slate-800">{movement.name}</p>
                {movement.description ? (
                  <p className="text-xs text-slate-500">{movement.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">
                  {movement.videoUrl ? "Video mevcut" : "Video yok"} · {movement._count?.routineMovements ?? 0} rutinde
                </p>
              </div>
              <Button variant="ghost" onClick={() => removeMovement(movement.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          {!loading && movements.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-sm text-slate-500">Henüz mobilite hareketi eklenmemiş.</div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Dumbbell className="h-5 w-5" /> Günlük Mobilite Rutinleri
        </h2>
        <form onSubmit={createRoutine} className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              placeholder="Rutin adı"
              value={routineName}
              onChange={(event) => setRoutineName(event.target.value)}
              required
            />
            <Input
              placeholder="Açıklama (opsiyonel)"
              value={routineDescription}
              onChange={(event) => setRoutineDescription(event.target.value)}
            />
            <Button type="button" variant="outline" onClick={addRoutineDraftItem}>
              <Plus className="mr-1 h-4 w-4" /> Hareket Ekle
            </Button>
          </div>

          <div className="space-y-2">
            {routineDraft.map((item, index) => (
              <div key={`${item.movementId}-${index}`} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[2fr_1fr_auto]">
                <select
                  value={item.movementId}
                  onChange={(event) => {
                    const movementId = event.target.value;
                    setRoutineDraft((prev) =>
                      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, movementId } : row)),
                    );
                  }}
                  className="h-10 rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {movements.map((movement) => (
                    <option key={movement.id} value={movement.id}>
                      {movement.name}
                    </option>
                  ))}
                </select>

                <Input
                  type="number"
                  min={15}
                  max={3600}
                  value={item.durationSeconds}
                  onChange={(event) => {
                    const durationSeconds = Number(event.target.value || 0);
                    setRoutineDraft((prev) =>
                      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, durationSeconds } : row)),
                    );
                  }}
                />

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRoutineDraft((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit">Rutin Kaydet</Button>
        </form>

        <div className="mt-5 space-y-3">
          {routines.map((routine) => (
            <div key={routine.id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{routine.name}</p>
                  {routine.description ? (
                    <p className="text-xs text-slate-500">{routine.description}</p>
                  ) : null}
                </div>
                <Button variant="ghost" onClick={() => removeRoutine(routine.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="space-y-1.5">
                {routine.movements.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs">
                    <span>{item.order + 1}. {item.movement.name}</span>
                    <span className="font-semibold text-slate-600">{item.durationSeconds} sn</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!loading && routines.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-sm text-slate-500">Henüz mobilite rutini oluşturulmamış.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
