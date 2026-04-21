"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";

const SEGMENT_LABELS: Record<string, string> = {
  coach: "Coach",
  client: "Client",
  dashboard: "Dashboard",
  templates: "Sablonlar",
  workouts: "Antrenmanlar",
  clients: "Danisanlar",
  coaches: "Coachlar",
  exercises: "Egzersizler",
  progress: "Ilerleme",
  review: "Inceleme",
  history: "Gecmis",
  profile: "Profil",
  settings: "Ayarlar",
  new: "Yeni",
  edit: "Duzenle",
  login: "Giris",
  register: "Kayit"
};

function segmentToLabel(segment: string): string {
  const normalized = segment.toLowerCase();
  if (SEGMENT_LABELS[normalized]) {
    return SEGMENT_LABELS[normalized];
  }

  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(segment)) {
    return "Detay";
  }

  if (/^[0-9a-z]{20,}$/i.test(segment)) {
    return "Detay";
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function GlobalBreadcrumb() {
  const pathname = usePathname();

  const items = useMemo<BreadcrumbItem[]>(() => {
    if (!pathname || pathname === "/") {
      return [];
    }

    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      return [];
    }

    return parts.map((part, index) => ({
      label: segmentToLabel(part),
      href: `/${parts.slice(0, index + 1).join("/")}`
    }));
  }, [pathname]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="my-auto">
      <Breadcrumb items={items} />
    </div>
  );
}
