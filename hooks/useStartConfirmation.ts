"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";

export type WorkoutInitData = {
  workoutId: string;
  templateName: string;
  exerciseCount: number;
  isOneTime: boolean;
};

export function useStartConfirmation() {
  const router = useRouter();
  const { warning } = useNotificationContext();
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<WorkoutInitData | null>(null);

  const requestStart = (data: WorkoutInitData) => {
    setPendingData(data);
    setShowConfirmation(true);
  };

  const confirmStart = () => {
    setShowConfirmation(false);
    // Confirmation accepted - parent component will proceed with API call
  };

  const cancelStart = () => {
    setShowConfirmation(false);
    setPendingData(null);
    warning("Antrenman başlatılmadı.");
  };

  return {
    showConfirmation,
    pendingData,
    requestStart,
    confirmStart,
    cancelStart
  };
}
