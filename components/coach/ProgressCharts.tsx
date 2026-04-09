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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        {/* Exercise Dropdown */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Antrenman Seçin
          </label>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {r === "4weeks" ? "4H" : r === "3months" ? "3A" : "Tüm"}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && data.length === 0 && !error && (
        <div className="p-8 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            {rangeLabel} için veri bulunamadı
          </p>
        </div>
      )}

      {/* Charts */}
      {!loading && data.length > 0 && (
        <>
          {/* Weight Chart */}
          <div className="bg-white rounded-lg shadow-md p-4 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Ağırlık Progresyonu ({rangeLabel})
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    label={{ value: "KG", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${value} kg`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#0284c7"
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
          <div className="bg-white rounded-lg shadow-md p-4 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Toplam Hacim ({rangeLabel})
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    label={{ value: "KG × Tekrar", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${value} kg×rep`}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalVolume"
                    fill="#16a34a"
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
