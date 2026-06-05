"use client";

import { FormEvent, useEffect, useState } from "react";
import { Clock3, Dumbbell, Plus, StretchHorizontal, Trash2, Video } from "lucide-react";

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
      const [movementResponse, routineResponse] = await Promise.all([
        fetch("/api/coach/mobility/movements"),
        fetch("/api/coach/mobility/routines"),
      ]);

      const movementData = await movementResponse.json().catch(() => ({}));
      const routineData = await routineResponse.json().catch(() => ({}));

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
      push(data.error || "Hareket olusturulamadi.");
      return;
    }

    setMovementName("");
    setMovementVideoUrl("");
    setMovementDescription("");
    push("Mobilite hareketi olusturuldu.");
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
    setRoutineDraft((previous) => [...previous, { movementId: movements[0].id, durationSeconds: 45 }]);
  };

  const createRoutine = async (event: FormEvent) => {
    event.preventDefault();

    if (routineDraft.length === 0) {
      push("Rutin icin en az bir hareket sec.");
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
      push(data.error || "Rutin olusturulamadi.");
      return;
    }

    setRoutineName("");
    setRoutineDescription("");
    setRoutineDraft([]);
    push("Mobilite rutini olusturuldu.");
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
    <div className="space-y-5 pb-[calc(var(--app-mobile-nav-height)+2rem)] md:pb-10">
      <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-sm md:px-6 md:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
              Mobility OS
            </div>
            <h1 className="text-[26px] font-black tracking-[-0.04em] text-slate-900 md:text-[30px]">
              Mobilite kutuphaneni duzenle
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hareket videolari, aciklamalar ve gunluk mobilite rutinleri burada tutulur.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-[320px]">
            {[
              { label: "Hareket", value: String(movements.length) },
              { label: "Rutin", value: String(routines.length) },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{metric.label}</div>
                <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <StretchHorizontal className="h-5 w-5 text-orange-500" />
            <div>
              <h2 className="text-lg font-black text-slate-900">Mobilite hareketleri</h2>
              <p className="text-sm text-slate-500">Kisa aciklama ve video linki ile katalog olustur.</p>
            </div>
          </div>

          <form onSubmit={createMovement} className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Hareket adi"
              value={movementName}
              onChange={(event) => setMovementName(event.target.value)}
              required
            />
            <Input
              placeholder="Video URL"
              value={movementVideoUrl}
              onChange={(event) => setMovementVideoUrl(event.target.value)}
            />
            <div className="md:col-span-2">
              <Input
                placeholder="Aciklama"
                value={movementDescription}
                onChange={(event) => setMovementDescription(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto">Hareket ekle</Button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {movements.map((movement) => (
              <div key={movement.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-900">{movement.name}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        {movement._count?.routineMovements ?? 0} rutin
                      </span>
                    </div>
                    {movement.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{movement.description}</p> : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                        <Video className="h-3.5 w-3.5" />
                        {movement.videoUrl ? "Video var" : "Video yok"}
                      </span>
                    </div>
                  </div>

                  <Button type="button" variant="ghost" onClick={() => removeMovement(movement.id)} className="shrink-0">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            {!loading && movements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                Henuz mobilite hareketi eklenmemis.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-violet-600" />
            <div>
              <h2 className="text-lg font-black text-slate-900">Gunluk mobilite rutinleri</h2>
              <p className="text-sm text-slate-500">Kisa, tekrar kullanilabilir akislari olustur.</p>
            </div>
          </div>

          <form onSubmit={createRoutine} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Rutin adi"
                value={routineName}
                onChange={(event) => setRoutineName(event.target.value)}
                required
              />
              <Input
                placeholder="Aciklama"
                value={routineDescription}
                onChange={(event) => setRoutineDescription(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-900">Rutin akisi</div>
                  <div className="text-xs text-slate-500">Sirayi ve sureyi burada belirle.</div>
                </div>
                <Button type="button" variant="outline" onClick={addRoutineDraftItem} className="w-full sm:w-auto">
                  <Plus className="mr-1 h-4 w-4" />
                  Hareket ekle
                </Button>
              </div>

              <div className="space-y-3">
                {routineDraft.map((item, index) => (
                  <div key={`${item.movementId}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Adim {index + 1}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setRoutineDraft((previous) => previous.filter((_, rowIndex) => rowIndex !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                      <select
                        value={item.movementId}
                        onChange={(event) => {
                          const movementId = event.target.value;
                          setRoutineDraft((previous) =>
                            previous.map((row, rowIndex) => (rowIndex === index ? { ...row, movementId } : row)),
                          );
                        }}
                        className="h-11 rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm"
                      >
                        {movements.map((movement) => (
                          <option key={movement.id} value={movement.id}>
                            {movement.name}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="number"
                          min={15}
                          max={3600}
                          value={item.durationSeconds}
                          onChange={(event) => {
                            const durationSeconds = Number(event.target.value || 0);
                            setRoutineDraft((previous) =>
                              previous.map((row, rowIndex) => (rowIndex === index ? { ...row, durationSeconds } : row)),
                            );
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {routineDraft.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Henuz rutin akisi eklenmedi.
                  </div>
                ) : null}
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">Rutini kaydet</Button>
          </form>

          <div className="mt-6 space-y-3">
            {routines.map((routine) => (
              <div key={routine.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{routine.name}</p>
                    {routine.description ? <p className="mt-1 text-sm text-slate-600">{routine.description}</p> : null}
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeRoutine(routine.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {routine.movements.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200/80">
                      <span className="font-medium text-slate-700">
                        {item.order + 1}. {item.movement.name}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                        {item.durationSeconds} sn
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!loading && routines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                Henuz mobilite rutini olusturulmamis.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
