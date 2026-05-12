"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Copy, GripVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { templateSchema } from "@/validations/template";

type ExerciseLibraryItem = {
  id: string;
  name: string;
  type: "WEIGHT" | "CARDIO";
};

type CardioProtocolItem = {
  durationMinutes: number;
  speed: number;
  incline: number;
};

type TemplateExerciseFormItem = {
  exerciseId: string;
  exerciseType: "WEIGHT" | "CARDIO";
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  targetRir: number | null;
  durationMinutes: number | null;
  protocol: CardioProtocolItem[] | null;
};

type TemplateCategory = {
  id: string;
  name: string;
  color: string;
  _count: { templates: number };
};

const CATEGORY_COLORS = [
  { label: "Yeşil", value: "#10b981" },
  { label: "Mavi", value: "#3b82f6" },
  { label: "Mor", value: "#8b5cf6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Kırmızı", value: "#f43f5e" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Turuncu", value: "#f97316" },
  { label: "Gri", value: "#64748b" }
];

type TemplateFormValues = {
  name: string;
  description?: string;
  categoryId?: string | null;
  exercises: TemplateExerciseFormItem[];
};

function asPositiveInteger(value: unknown, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(1, Math.round(numeric));
}

function asNonNegativeInteger(value: unknown, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(0, Math.round(numeric));
}

export function TemplateForm({
  endpoint,
  initialValues
}: {
  endpoint: string;
  initialValues?: Partial<TemplateFormValues>;
}) {
  const router = useRouter();
  const { push } = useNotificationContext();
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showJsonExamples, setShowJsonExamples] = useState(false);
  const [jsonImportInput, setJsonImportInput] = useState("");
  const [jsonImportError, setJsonImportError] = useState("");

  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialValues?.categoryId ?? null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#10b981");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema) as never,
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      categoryId: initialValues?.categoryId ?? null,
      exercises: initialValues?.exercises ?? []
    }
  });
  const { fields, append, move, remove } = useFieldArray({
    control: form.control,
    name: "exercises"
  });
  const exercises = useWatch({ control: form.control, name: "exercises" }) || [];

  useEffect(() => {
    const loadExercises = async () => {
      const response = await fetch("/api/coach/exercises");
      const data = await response.json();
      setExerciseLibrary(data.exercises || []);
    };

    const loadCategories = async () => {
      const response = await fetch("/api/coach/template-categories");
      const data = await response.json();
      setCategories(data.categories || []);
    };

    loadExercises();
    loadCategories();
  }, []);

  const exerciseMap = useMemo(() => {
    return new Map(exerciseLibrary.map((exercise) => [exercise.id, exercise]));
  }, [exerciseLibrary]);

  const selectCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    form.setValue("categoryId", id, { shouldDirty: true });
  };

  const saveNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setIsSavingCategory(true);
    const res = await fetch("/api/coach/template-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: newCategoryColor })
    });
    setIsSavingCategory(false);
    if (!res.ok) { push("Kategori oluşturulamadı."); return; }
    const { category } = await res.json();
    setCategories((prev) => [...prev, category]);
    selectCategory(category.id);
    setNewCategoryName("");
    setNewCategoryColor("#10b981");
    setShowNewCategory(false);
  };

  const syncOrders = () => {
    const nextExercises = form.getValues("exercises");
    nextExercises.forEach((_, index) => {
      form.setValue(`exercises.${index}.order`, index, {
        shouldDirty: false,
        shouldValidate: false
      });
    });
  };

  const addExercise = () => {
    const selectedExercise = exerciseMap.get(selectedExerciseId);
    if (!selectedExercise) {
      push("Önce bir egzersiz seçin.");
      return;
    }

    append({
      exerciseId: selectedExercise.id,
      exerciseType: selectedExercise.type,
      order: fields.length,
      targetSets: selectedExercise.type === "WEIGHT" ? 3 : null,
      targetReps: selectedExercise.type === "WEIGHT" ? 10 : null,
      targetRir: selectedExercise.type === "WEIGHT" ? 2 : null,
      durationMinutes: selectedExercise.type === "CARDIO" ? 20 : null,
      protocol:
        selectedExercise.type === "CARDIO"
          ? [{ durationMinutes: 1, speed: 5, incline: 0 }]
          : null
    });

    setSelectedExerciseId("");
    queueMicrotask(syncOrders);
  };

  const addProtocolRow = (exerciseIndex: number) => {
    const currentProtocol = form.getValues(`exercises.${exerciseIndex}.protocol`) || [];
    form.setValue(
      `exercises.${exerciseIndex}.protocol`,
      [
        ...currentProtocol,
        {
          durationMinutes: 1,
          speed: 5,
          incline: 0
        }
      ],
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const removeProtocolRow = (exerciseIndex: number, protocolIndex: number) => {
    const currentProtocol = form.getValues(`exercises.${exerciseIndex}.protocol`) || [];
    const nextProtocol = currentProtocol.filter((_, index) => index !== protocolIndex);

    form.setValue(
      `exercises.${exerciseIndex}.protocol`,
      nextProtocol,
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const getCardioTotalMinutes = (exerciseIndex: number) => {
    const rows = form.getValues(`exercises.${exerciseIndex}.protocol`) || [];
    return rows.reduce((sum, row) => sum + asPositiveInteger(row.durationMinutes, 1), 0);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    move(result.source.index, result.destination.index);
    queueMicrotask(syncOrders);
  };

  const aiTemplatePrompt = `Sen bir antrenman template JSON ureten asistansin.

Girdi olarak sana su iki sey verilecek:
1) JSON sema ornegi
2) Veritabani egzersiz listesi (format: /id/name/type)

Gorevin:
- Kullanici istegine gore uygun bir template JSON uret.
- Sadece egzersiz listesindeki id degerlerini kullan.
- type = WEIGHT olanlarda targetSets, targetReps, targetRir dolu olsun; durationMinutes ve protocol null olsun.
- type = CARDIO olanlarda durationMinutes ve protocol dolu olsun; targetSets, targetReps, targetRir null olsun.
- order alanlarini 0'dan baslayarak sirali ver.
- Cikti yalnizca gecerli JSON olsun, aciklama metni yazma.


Beklenen JSON formati:
{
  "name": "Template Adi",
  "description": "Kisa aciklama",
  "exercises": [
    {
      "exerciseType": "WEIGHT",
      "exerciseId": "ornek-id",
      "order": 0,
      "targetSets": 4,
      "targetReps": 6,
      "targetRir": 2,
      "durationMinutes": null,
      "protocol": null
    },
    {
      "exerciseType": "CARDIO",
      "exerciseId": "ornek-cardio-id",
      "order": 1,
      "durationMinutes": 15,
      "protocol": [
        { "durationMinutes": 5, "speed": 8, "incline": 0 },
        { "durationMinutes": 5, "speed": 10, "incline": 2 },
        { "durationMinutes": 5, "speed": 7, "incline": 0 }
      ],
      "targetSets": null,
      "targetReps": null,
      "targetRir": null
    }
  ]
}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      push(`${label} JSON kopyalandı.`);
    } catch {
      push("Klipborda kopyalanamadı.");
    }
  };

  const handleJsonImport = () => {
    setJsonImportError("");
    
    try {
      const parsedTemplate = JSON.parse(jsonImportInput);
      
      // Validate structure
      if (!parsedTemplate.name || !Array.isArray(parsedTemplate.exercises)) {
        throw new Error("JSON şu alanları içermelidir: name, exercises (array)");
      }

      if (parsedTemplate.exercises.length === 0) {
        throw new Error("En az bir egzersiz eklemelisiniz.");
      }

      // Set form values from JSON
      form.setValue("name", parsedTemplate.name || "", { shouldValidate: true });
      form.setValue("description", parsedTemplate.description || "", { shouldValidate: true });
      
      // Clear current exercises and add new ones
      while (fields.length > 0) {
        remove(0);
      }

      // Add exercises from JSON
      parsedTemplate.exercises.forEach((exercise: unknown, index: number) => {
        const ex = exercise as Record<string, unknown>;
        append({
          exerciseId: (ex.exerciseId as string) || "",
          exerciseType: (ex.exerciseType as "WEIGHT" | "CARDIO") || "WEIGHT",
          order: index,
          targetSets: ex.exerciseType === "WEIGHT" ? ((ex.targetSets as number) || null) : null,
          targetReps: ex.exerciseType === "WEIGHT" ? ((ex.targetReps as number) || null) : null,
          targetRir: ex.exerciseType === "WEIGHT" ? ((ex.targetRir as number) || null) : null,
          durationMinutes: ex.exerciseType === "CARDIO" ? ((ex.durationMinutes as number) || null) : null,
          protocol: ex.exerciseType === "CARDIO" ? ((ex.protocol as CardioProtocolItem[]) || null) : null
        });
      });

      setJsonImportInput("");
      push("Antrenman JSON başarıyla yüklendi!");
      setShowJsonExamples(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Geçersiz JSON formatı";
      setJsonImportError(message);
    }
  };

  const submit = async (values: TemplateFormValues) => {
    setIsSubmitting(true);

    const normalizedValues: TemplateFormValues = {
      ...values,
      name: values.name.trim(),
      description: values.description?.trim() || "",
      categoryId: selectedCategoryId,
      exercises: values.exercises.map((exercise, index) => {
        if (exercise.exerciseType === "WEIGHT") {
          return {
            ...exercise,
            order: index,
            targetSets: asPositiveInteger(exercise.targetSets, 3),
            targetReps: asPositiveInteger(exercise.targetReps, 10),
            targetRir: asNonNegativeInteger(exercise.targetRir, 2),
            durationMinutes: null,
            protocol: null
          };
        }

        return {
          ...exercise,
          order: index,
          protocol: (exercise.protocol || [{ durationMinutes: 1, speed: 5, incline: 0 }]).map((row) => ({
            durationMinutes: asPositiveInteger(row.durationMinutes, 1),
            speed: Number.isFinite(Number(row.speed)) ? Number(row.speed) : 5,
            incline: Number.isFinite(Number(row.incline)) ? Number(row.incline) : 0
          })),
          durationMinutes: (exercise.protocol || [{ durationMinutes: 1, speed: 5, incline: 0 }]).reduce(
            (sum, row) => sum + asPositiveInteger(row.durationMinutes, 1),
            0
          ),
          targetSets: null,
          targetReps: null,
          targetRir: null
        };
      })
    };

    const response = await fetch(endpoint, {
      method: initialValues ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedValues)
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const validationMessage = typeof data?.error?.formErrors?.[0] === "string" ? data.error.formErrors[0] : null;
      push(validationMessage || data.error || "Antrenman kaydedilemedi.");
      return;
    }

    push(initialValues ? "Antrenman güncellendi." : "Antrenman oluşturuldu.");
    router.push("/coach/templates");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      {/* Category Picker */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Kategori</p>
        <input type="hidden" {...form.register("categoryId")} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              selectedCategoryId === null
                ? "border-slate-400 bg-slate-100 text-slate-700 shadow-sm"
                : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
            }`}
          >
            Kategorisiz
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                selectedCategoryId === cat.id
                  ? "shadow-sm"
                  : "opacity-60 hover:opacity-90"
              }`}
              style={{
                borderColor: cat.color,
                backgroundColor: selectedCategoryId === cat.id ? cat.color + "22" : "transparent",
                color: cat.color
              }}
            >
              {cat.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowNewCategory(!showNewCategory)}
            className="rounded-full border border-dashed border-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50"
          >
            + Yeni
          </button>
        </div>

        {showNewCategory && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveNewCategory(); } }}
              placeholder="Kategori adı"
              className="h-8 flex-1 min-w-32 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <div className="flex items-center gap-1">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setNewCategoryColor(c.value)}
                  className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${newCategoryColor === c.value ? "ring-2 ring-offset-1 ring-slate-400 scale-110" : ""}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => void saveNewCategory()}
              disabled={!newCategoryName.trim() || isSavingCategory}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSavingCategory ? "..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewCategory(false)}
              className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              İptal
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Input placeholder="Antrenman adı" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <textarea
        placeholder="Açıklama"
        className="min-h-28 w-full rounded-md border bg-background p-3 text-sm"
        {...form.register("description")}
      />

      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setShowJsonExamples(!showJsonExamples)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold text-sm">
            JSON ile Hızlı Antrenman Oluştur
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showJsonExamples ? "rotate-180" : ""}`}
          />
        </button>

        {showJsonExamples && (
          <div className="border-t p-4 space-y-6 bg-muted/30">
            {/* JSON Import Section */}
            <div className="space-y-3 border-b pb-6">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  JSON Formatında Antrenman Yükleme
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  JSON yapıştırın veya aşağıdaki örneklerden birini kullanın.
                  Antrenman anında oluşturulacak!
                </p>
              </div>

              <textarea
                value={jsonImportInput}
                onChange={(e) => setJsonImportInput(e.target.value)}
                placeholder={
                  '{\n  "name": "Antrenman Adı",\n  "description": "Açıklama",\n  "exercises": [...]\n}'
                }
                className="w-full h-40 rounded-md border bg-background p-3 text-xs font-mono"
              />

              {jsonImportError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  ❌ {jsonImportError}
                </div>
              )}

              <button
                type="button"
                onClick={handleJsonImport}
                disabled={!jsonImportInput.trim()}
                className="w-full px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                JSON Yükle ve Formu Doldur
              </button>
            </div>

            {/* Examples Section */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">
                Örnek Antrenman JSON Yapıları
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                "Kullan" butonuna tıklayarak herhangi bir örneği yükleme alanına
                yapıştırabilir, ardından "JSON Yükle" butonuna basabilirsiniz.
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  AI Prompt Şablonu
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(aiTemplatePrompt, "AI Prompt")}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Copy className="h-3 w-3" />
                  Kopyala
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Bu promptu bir AI araca verip altina JSON sema + exercise
                listesini ekleyerek tek seferde antrenman JSON uretebilirsiniz.
              </p>
              <pre className="rounded-lg border bg-background p-3 text-xs overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap">
                <code>{aiTemplatePrompt}</code>
              </pre>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm font-semibold text-foreground mb-2">
                Veritabanindaki Tum Egzersizler
              </p>
              <p className="text-xs text-muted-foreground mb-3" onClick={() => copyToClipboard(exerciseLibrary.map(exercise => `/${exercise.id}/${exercise.name}/${exercise.type}`).join("\n"), "Egzersiz Listesi")} style={{ cursor: "pointer" }}>
                Copy
              </p>
              <pre className="rounded-lg border bg-background p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto">
                <code>
                  {exerciseLibrary.length === 0
                    ? "Egzersiz listesi yukleniyor..."
                    : [...exerciseLibrary]
                        .sort((a, b) => a.name.localeCompare(b.name, "tr"))
                        .map(
                          (exercise) =>
                            `${exercise.id}/${exercise.name}/${exercise.type}`,
                        )
                        .join("\n")}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <select
            value={selectedExerciseId}
            onChange={(event) => setSelectedExerciseId(event.target.value)}
            className="h-10 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Egzersiz kütüphanesinden seç</option>
            {exerciseLibrary.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} ({exercise.type})
              </option>
            ))}
          </select>
          <Button type="button" onClick={addExercise}>
            <Plus className="mr-2 h-4 w-4" />
            Egzersiz Ekle
          </Button>
        </div>
      </div>

      {form.formState.errors.exercises && (
        <p className="text-xs text-red-500">
          En az bir egzersiz eklemelisiniz.
        </p>
      )}

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Antrenman henüz boş. Egzersiz kütüphanesinden hareket ekleyin.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="template-exercises">
            {(droppableProvided) => (
              <div
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
                className="space-y-3"
              >
                {fields.map((field, index) => {
                  const currentExercise = exercises[index];
                  const exerciseInfo = exerciseMap.get(
                    currentExercise?.exerciseId || "",
                  );

                  return (
                    <Draggable
                      key={field.id}
                      draggableId={field.id}
                      index={index}
                    >
                      {(draggableProvided) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          className="rounded-xl border p-4"
                        >
                          <input
                            type="hidden"
                            {...form.register(`exercises.${index}.exerciseId`)}
                          />
                          <input
                            type="hidden"
                            {...form.register(
                              `exercises.${index}.exerciseType`,
                            )}
                          />
                          <input
                            type="hidden"
                            {...form.register(`exercises.${index}.order`, {
                              valueAsNumber: true,
                            })}
                          />

                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                className="mt-0.5 cursor-grab text-muted-foreground"
                                {...draggableProvided.dragHandleProps}
                              >
                                <GripVertical className="h-5 w-5" />
                              </button>
                              <div>
                                <p className="font-semibold">
                                  {exerciseInfo?.name || "Egzersiz"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {currentExercise?.exerciseType}
                                </p>
                              </div>
                            </div>
                            <ActionMenu
                              items={[
                                {
                                  label: "Egzersizi kaldir",
                                  danger: true,
                                  onClick: () => remove(index),
                                },
                              ]}
                            />
                          </div>

                          {currentExercise?.exerciseType === "WEIGHT" ? (
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="space-y-1">
                                <label className="text-sm font-medium">
                                  Hedef Set
                                </label>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `exercises.${index}.targetSets`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-sm font-medium">
                                  Hedef Tekrar
                                </label>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `exercises.${index}.targetReps`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-sm font-medium">
                                  Hedef RIR
                                </label>
                                <Input
                                  type="number"
                                  {...form.register(
                                    `exercises.${index}.targetRir`,
                                    { valueAsNumber: true },
                                  )}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="rounded-lg border border-emerald-200/50 bg-emerald-50/70 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                  Toplam Sure
                                </p>
                                <p className="mt-1 text-lg font-black text-emerald-900">
                                  {getCardioTotalMinutes(index)} dakika
                                </p>
                                <p className="text-xs text-emerald-700">
                                  Sure otomatik olarak satirlarin toplamiyla
                                  hesaplanir.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">
                                    Sure Bazli Protokol
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => addProtocolRow(index)}
                                  >
                                    Satır Ekle
                                  </Button>
                                </div>

                                {(currentExercise?.protocol || []).map(
                                  (protocolItem, protocolIndex) => (
                                    <div
                                      key={`${field.id}-${protocolIndex}`}
                                      className="rounded-xl border bg-card p-3"
                                    >
                                      <div className="mb-2 flex items-center justify-between border-b pb-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                          Blok {protocolIndex + 1}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg font-black text-foreground">
                                            {protocolItem.durationMinutes} dk
                                          </span>
                                          <ActionMenu
                                            items={[
                                              {
                                                label: "Satiri sil",
                                                danger: true,
                                                onClick: () =>
                                                  removeProtocolRow(
                                                    index,
                                                    protocolIndex,
                                                  ),
                                              },
                                            ]}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid gap-2 md:grid-cols-3">
                                        <Input
                                          type="number"
                                          placeholder="Sure (dk)"
                                          defaultValue={
                                            protocolItem.durationMinutes
                                          }
                                          {...form.register(
                                            `exercises.${index}.protocol.${protocolIndex}.durationMinutes`,
                                            { valueAsNumber: true },
                                          )}
                                        />
                                        <Input
                                          type="number"
                                          step="0.1"
                                          placeholder="Hız"
                                          defaultValue={protocolItem.speed}
                                          {...form.register(
                                            `exercises.${index}.protocol.${protocolIndex}.speed`,
                                            { valueAsNumber: true },
                                          )}
                                        />
                                        <Input
                                          type="number"
                                          step="0.1"
                                          placeholder="Eğim"
                                          defaultValue={protocolItem.incline}
                                          {...form.register(
                                            `exercises.${index}.protocol.${protocolIndex}.incline`,
                                            { valueAsNumber: true },
                                          )}
                                        />
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {initialValues ? "Template Güncelle" : "Template Oluştur"}
      </Button>
    </form>
  );
}
