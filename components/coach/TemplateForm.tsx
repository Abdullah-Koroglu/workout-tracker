"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Plus } from "lucide-react";
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
  minute: number;
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

type TemplateFormValues = {
  name: string;
  description?: string;
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

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema) as never,
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
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

    loadExercises();
  }, []);

  const exerciseMap = useMemo(() => {
    return new Map(exerciseLibrary.map((exercise) => [exercise.id, exercise]));
  }, [exerciseLibrary]);

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
          ? [{ minute: 1, speed: 5, incline: 0 }]
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
          minute: currentProtocol.length + 1,
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
      nextProtocol.map((row, index) => ({ ...row, minute: index + 1 })),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    move(result.source.index, result.destination.index);
    queueMicrotask(syncOrders);
  };

  const submit = async (values: TemplateFormValues) => {
    setIsSubmitting(true);

    const normalizedValues: TemplateFormValues = {
      ...values,
      name: values.name.trim(),
      description: values.description?.trim() || "",
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
          durationMinutes: asPositiveInteger(exercise.durationMinutes, 20),
          protocol: (exercise.protocol || [{ minute: 1, speed: 5, incline: 0 }]).map((row, protocolIndex) => ({
            minute: asPositiveInteger(row.minute, protocolIndex + 1),
            speed: Number.isFinite(Number(row.speed)) ? Number(row.speed) : 5,
            incline: Number.isFinite(Number(row.incline)) ? Number(row.incline) : 0
          })),
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
      push(validationMessage || data.error || "Template kaydedilemedi.");
      return;
    }

    push(initialValues ? "Template güncellendi." : "Template oluşturuldu.");
    router.push("/coach/templates");
    router.refresh();
  };

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(submit)}>
      <div className="space-y-1">
        <Input placeholder="Template adı" {...form.register("name")} />
        {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
      </div>
      <textarea
        placeholder="Açıklama"
        className="min-h-28 w-full rounded-md border bg-background p-3 text-sm"
        {...form.register("description")}
      />

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
        <p className="text-xs text-red-500">En az bir egzersiz eklemelisiniz.</p>
      )}

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Template henüz boş. Egzersiz kütüphanesinden hareket ekleyin.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="template-exercises">
            {(droppableProvided) => (
              <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps} className="space-y-3">
                {fields.map((field, index) => {
                  const currentExercise = exercises[index];
                  const exerciseInfo = exerciseMap.get(currentExercise?.exerciseId || "");

                  return (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(draggableProvided) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          className="rounded-xl border p-4"
                        >
                          <input type="hidden" {...form.register(`exercises.${index}.exerciseId`)} />
                          <input type="hidden" {...form.register(`exercises.${index}.exerciseType`)} />
                          <input type="hidden" {...form.register(`exercises.${index}.order`, { valueAsNumber: true })} />

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
                                <p className="font-semibold">{exerciseInfo?.name || "Egzersiz"}</p>
                                <p className="text-xs text-muted-foreground">{currentExercise?.exerciseType}</p>
                              </div>
                            </div>
                            <ActionMenu
                              items={[
                                {
                                  label: "Egzersizi kaldir",
                                  danger: true,
                                  onClick: () => remove(index)
                                }
                              ]}
                            />
                          </div>

                          {currentExercise?.exerciseType === "WEIGHT" ? (
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="space-y-1">
                                <label className="text-sm font-medium">Hedef Set</label>
                                <Input type="number" {...form.register(`exercises.${index}.targetSets`, { valueAsNumber: true })} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-sm font-medium">Hedef Tekrar</label>
                                <Input type="number" {...form.register(`exercises.${index}.targetReps`, { valueAsNumber: true })} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-sm font-medium">Hedef RIR</label>
                                <Input type="number" {...form.register(`exercises.${index}.targetRir`, { valueAsNumber: true })} />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-sm font-medium">Toplam Dakika</label>
                                <Input type="number" {...form.register(`exercises.${index}.durationMinutes`, { valueAsNumber: true })} />
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">Dakika Bazlı Protokol</p>
                                  <Button type="button" variant="outline" onClick={() => addProtocolRow(index)}>
                                    Satır Ekle
                                  </Button>
                                </div>

                                {(currentExercise?.protocol || []).map((protocolItem, protocolIndex) => (
                                  <div key={`${field.id}-${protocolIndex}`} className="rounded-xl border bg-card p-3">
                                    <div className="mb-2 flex items-center justify-between border-b pb-2">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                        Dakika Bloğu
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-foreground">{protocolItem.minute}</span>
                                        <ActionMenu
                                          items={[
                                            {
                                              label: "Satiri sil",
                                              danger: true,
                                              onClick: () => removeProtocolRow(index, protocolIndex)
                                            }
                                          ]}
                                        />
                                      </div>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3">
                                      <Input
                                        type="number"
                                        placeholder="Dakika"
                                        defaultValue={protocolItem.minute}
                                        {...form.register(`exercises.${index}.protocol.${protocolIndex}.minute`, { valueAsNumber: true })}
                                      />
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Hız"
                                        defaultValue={protocolItem.speed}
                                        {...form.register(`exercises.${index}.protocol.${protocolIndex}.speed`, { valueAsNumber: true })}
                                      />
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Eğim"
                                        defaultValue={protocolItem.incline}
                                        {...form.register(`exercises.${index}.protocol.${protocolIndex}.incline`, { valueAsNumber: true })}
                                      />
                                    </div>
                                  </div>
                                ))}
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
