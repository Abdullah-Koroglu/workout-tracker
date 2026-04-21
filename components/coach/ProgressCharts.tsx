"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
// import { Format as formatDate } from "date-fns"; // Removed unused import

interface ProgressData {
  date: string;
  maxWeight: number;
  totalVolume: number;
  setCount: number;
}

interface ProgressChartProps {
  clientId: string;
  exercises: Array<{ id: string; name: string }>;
}

export function ProgressCharts({ clientId, exercises }: ProgressChartProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id || "");
  const [range, setRange] = useState<"4weeks" | "3months" | "all">("4weeks");
  const [data, setData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!selectedExerciseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/coach/clients/${clientId}/progress?exerciseId=${selectedExerciseId}&range=${range}`
      );

      if (!response.ok) {
        throw new Error("İlerleme verileri yüklenemedi");
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, selectedExerciseId, range]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const rangeLabel = useMemo(() => {
    switch (range) {
      case "4weeks":
        return "Son 4 Hafta";
      case "3months":
        return "Son 3 Ay";
      case "all":
        return "Tüm Zaman";
      default:
        return range;
    }
  }, [range]);

  const maxWeightPeak = data.reduce((acc, cur) => Math.max(acc, cur.maxWeight), 0);
  const maxVolumePeak = data.reduce((acc, cur) => Math.max(acc, cur.totalVolume), 0);
  const totalSets = data.reduce((acc, cur) => acc + cur.setCount, 0);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        {/* Exercise Dropdown */}
        <div className="flex-1">
          <label className="mb-2 block text-sm font-semibold text-muted-foreground">
            Antrenman Seçin
          </label>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="block w-full rounded-lg border-0 bg-muted/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {/* Range Filter Buttons */}
        <div className="flex gap-2">
          {(["4weeks", "3months", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                range === r
                  ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "4weeks" ? "4H" : r === "3months" ? "3A" : "Tüm"}
            </button>
          ))}
        </div>
        </div>
      </div>

      {!loading && data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-card p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Max Ağırlık</p>
            <p className="mt-1 text-2xl font-black text-primary">{maxWeightPeak} kg</p>
          </div>
          <div className="rounded-lg bg-card p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Max Hacim</p>
            <p className="mt-1 text-2xl font-black text-secondary">{maxVolumePeak}</p>
          </div>
          <div className="rounded-lg bg-card p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Toplam Set</p>
            <p className="mt-1 text-2xl font-black text-foreground">{totalSets}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && data.length === 0 && !error && (
        <div className="rounded-lg bg-muted/40 p-8 text-center">
          <p className="text-muted-foreground">
            {rangeLabel} için veri bulunamadı
          </p>
        </div>
      )}

      {/* Charts */}
      {!loading && data.length > 0 && (
        <>
          {/* Weight Chart */}
          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5">
            <h3 className="mb-4 text-lg font-black text-slate-900">
              Ağırlık Progresyonu ({rangeLabel})
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    label={{ value: "KG", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${value} kg`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Max Ağırlık"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-black/5">
            <h3 className="mb-4 text-lg font-black text-slate-900">
              Toplam Hacim ({rangeLabel})
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    label={{ value: "KG × Tekrar", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${value} kg×rep`}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalVolume"
                    fill="#455f88"
                    name="Toplam Hacim"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
