# 🖼️ Dönüşüm Fotoğrafları Yönetimi - Implementation Guide

## 📌 Neden Bu Önem Taşıyor?

Şu anda sistem:
- ✅ Database'te dönüşüm fotoğraflarını saklıyor
- ✅ Client sayfasında gösteriyor (TransformCarousel)
- ❌ Koçlar fotoğraf ekleyemiyor / düzenleyemiyor
- ❌ Koçlar detay bilgisi (kilo, tarih, ad) girebi liyor

**Sonuç**: Koçlar transformation gallery'lerini oluşturalamıyor!

---

## 🎯 Implementation Plan

### Phase 1: Backend (1 saat)

#### 1.1 Validasyon Şeması Oluştur
```typescript
// lib/validations/transformation.ts

import { z } from "zod";

export const transformationPhotoSchema = z.object({
  beforeUrl: z.string().url("Geçerli bir URL giriniz"),
  afterUrl: z.string().url("Geçerli bir URL giriniz"),
  title: z.string().max(100).optional(),
  beforeDate: z.string().datetime().optional(),
  afterDate: z.string().datetime().optional(),
  beforeWeight: z.number().positive().optional(),
  afterWeight: z.number().positive().optional(),
  duration: z.string().max(50).optional(), // "3 ay", "6 hafta"
  clientName: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export type TransformationPhoto = z.infer<typeof transformationPhotoSchema>;
```

#### 1.2 API Endpoint Oluştur
```typescript
// app/api/coach/transformations/route.ts

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { transformationPhotoSchema } from "@/validations/transformation";
import { Prisma } from "@prisma/client";

// POST /api/coach/transformations
export async function POST(request: Request) {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = transformationPhotoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = auth.session.user.id;
  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Koç profili bulunamadı" },
      { status: 404 }
    );
  }

  // Mevcut transformation fotoğraflarını al
  const existing = Array.isArray(profile.transformationPhotos)
    ? (profile.transformationPhotos as any[])
    : [];

  // Yeni fotoğrafı ekle
  const updated = [...existing, { ...parsed.data, id: crypto.randomUUID() }];

  // Database'e kaydet
  await prisma.coachProfile.update({
    where: { id: profile.id },
    data: {
      transformationPhotos: updated as Prisma.JsonValue,
    },
  });

  return NextResponse.json({
    message: "Dönüşüm fotoğrafı eklendi",
    transformation: { ...parsed.data, id: crypto.randomUUID() },
  });
}

// DELETE /api/coach/transformations/[id]
export async function DELETE(request: Request) {
  const auth = await requireAuth("COACH");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID zorunludur" },
      { status: 400 }
    );
  }

  const userId = auth.session.user.id;
  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Koç profili bulunamadı" },
      { status: 404 }
    );
  }

  const existing = Array.isArray(profile.transformationPhotos)
    ? (profile.transformationPhotos as any[])
    : [];

  const filtered = existing.filter((t) => t.id !== id);

  await prisma.coachProfile.update({
    where: { id: profile.id },
    data: {
      transformationPhotos: filtered as Prisma.JsonValue,
    },
  });

  return NextResponse.json({ message: "Silindi" });
}
```

---

### Phase 2: UI Component (2 saat)

#### 2.1 TransformationPhotosManager Component
```typescript
// components/coach/TransformationPhotosManager.tsx

"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Calendar,
  Weight,
  User2,
} from "lucide-react";
import { useNotificationContext } from "@/contexts/NotificationContext";

type TransformationPhoto = {
  id?: string;
  beforeUrl: string;
  afterUrl: string;
  title?: string;
  beforeDate?: string;
  afterDate?: string;
  beforeWeight?: number;
  afterWeight?: number;
  duration?: string;
  clientName?: string;
  notes?: string;
};

interface TransformationPhotosManagerProps {
  initialPhotos: TransformationPhoto[];
  onPhotosChange?: (photos: TransformationPhoto[]) => void;
}

export function TransformationPhotosManager({
  initialPhotos,
  onPhotosChange,
}: TransformationPhotosManagerProps) {
  const { success, error: notifyError } = useNotificationContext();
  const [photos, setPhotos] = useState<TransformationPhoto[]>(initialPhotos);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [title, setTitle] = useState("");
  const [beforeDate, setBeforeDate] = useState("");
  const [afterDate, setAfterDate] = useState("");
  const [beforeWeight, setBeforeWeight] = useState("");
  const [afterWeight, setAfterWeight] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = async () => {
    if (!beforeUrl.trim() || !afterUrl.trim()) {
      notifyError("Önce ve Sonra görselleri zorunludur");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/coach/transformations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beforeUrl: beforeUrl.trim(),
        afterUrl: afterUrl.trim(),
        title: title.trim() || undefined,
        beforeDate: beforeDate || undefined,
        afterDate: afterDate || undefined,
        beforeWeight: beforeWeight ? Number(beforeWeight) : undefined,
        afterWeight: afterWeight ? Number(afterWeight) : undefined,
        clientName: clientName.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      notifyError(data.error || "Eklenemedi");
      return;
    }

    const data = await res.json() as { transformation: TransformationPhoto };
    const newPhotos = [...photos, data.transformation];
    setPhotos(newPhotos);
    onPhotosChange?.(newPhotos);

    // Form temizle
    setBeforeUrl("");
    setAfterUrl("");
    setTitle("");
    setBeforeDate("");
    setAfterDate("");
    setBeforeWeight("");
    setAfterWeight("");
    setClientName("");
    setNotes("");

    success("Dönüşüm fotoğrafı eklendi!");
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;

    setDeleting(id);
    const res = await fetch(`/api/coach/transformations?id=${id}`, {
      method: "DELETE",
    });
    setDeleting(null);

    if (!res.ok) {
      notifyError("Silemedi");
      return;
    }

    const filtered = photos.filter((p) => p.id !== id);
    setPhotos(filtered);
    onPhotosChange?.(filtered);
    success("Silindi");
  };

  return (
    <div className="space-y-5">
      {/* Add New Card */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
            <ImageIcon className="h-4 w-4 text-orange-500" />
          </div>
          <h3 className="font-black text-slate-800">Yeni Dönüşüm Ekle</h3>
        </div>

        <div className="space-y-4">
          {/* URLs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">
                Önce Görseli (URL)
              </label>
              <input
                type="url"
                value={beforeUrl}
                onChange={(e) => setBeforeUrl(e.target.value)}
                placeholder="https://..."
                className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">
                Sonra Görseli (URL)
              </label>
              <input
                type="url"
                value={afterUrl}
                onChange={(e) => setAfterUrl(e.target.value)}
                placeholder="https://..."
                className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">
              Başlık (Opsiyonel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn: Ayşe'nin 6 Aylık Yolculuğu"
              className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <Calendar className="h-3.5 w-3.5" />
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
                className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <Calendar className="h-3.5 w-3.5" />
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={afterDate}
                onChange={(e) => setAfterDate(e.target.value)}
                className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Weights */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <Weight className="h-3.5 w-3.5" />
                Başlangıç Kilosu (kg)
              </label>
              <input
                type="number"
                value={beforeWeight}
                onChange={(e) => setBeforeWeight(e.target.value)}
                placeholder="95"
                className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-600">
                <Weight className="h-3.5 w-3.5" />
                Bitiş Kilosu (kg)
              </label>
              <input
                type="number"
                value={afterWeight}
                onChange={(e) => setAfterWeight(e.target.value)}
                placeholder="75"
                className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-bold text-slate-600">
              <User2 className="h-3.5 w-3.5" />
              Danışan Adı (Opsiyonel)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ayşe Y."
              className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">
              Notlar (Opsiyonel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bu dönüşüm hakkında notlar..."
              rows={3}
              className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FB923C, #EA580C)",
            }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {loading ? "Ekleniyor..." : "Dönüşüm Ekle"}
          </button>
        </div>
      </div>

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="rounded-2xl bg-white p-6 border border-slate-200">
          <h3 className="mb-4 font-black text-slate-800">
            Dönüşüm Galerisi ({photos.length})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, idx) => (
              <div
                key={photo.id || idx}
                className="rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Images Preview */}
                <div className="relative h-40 bg-slate-100">
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 border-r border-slate-300 overflow-hidden">
                      <img
                        src={photo.beforeUrl}
                        alt="Önce"
                        className="w-full h-full object-cover"
                        onError={() => notifyError("Öncesi görseli yüklenemedi")}
                      />
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                        ÖNCE
                      </span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <img
                        src={photo.afterUrl}
                        alt="Sonra"
                        className="w-full h-full object-cover"
                        onError={() => notifyError("Sonrası görseli yüklenemedi")}
                      />
                      <span className="absolute top-1 right-1 bg-orange-500/80 text-white text-[10px] px-2 py-1 rounded">
                        SONRA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  {photo.title && (
                    <p className="font-bold text-sm text-slate-800 line-clamp-1">
                      {photo.title}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {photo.beforeWeight && photo.afterWeight && (
                      <p>
                        <span className="font-bold">Kilo:</span> {photo.beforeWeight}
                        kg → {photo.afterWeight}kg{" "}
                        <span className="text-green-600">
                          ({(photo.afterWeight - photo.beforeWeight).toFixed(1)} kg)
                        </span>
                      </p>
                    )}
                    {photo.clientName && (
                      <p>
                        <span className="font-bold">Danışan:</span> {photo.clientName}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={deleting === photo.id}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deleting === photo.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Phase 3: Integration (1 saat)

#### 3.1 Coach Profile Page'e Ekleme
```typescript
// app/(coach)/coach/profile/page.tsx içine ekle

import { TransformationPhotosManager } from "@/components/coach/TransformationPhotosManager";

// ... component içinde ...

return (
  <div className="space-y-6 pb-16">
    {/* ... existing content ... */}

    {/* Transformation Photos Section - Add before packages section */}
    <div className="xl:col-span-2">
      <TransformationPhotosManager 
        initialPhotos={transformationPhotos}
        onPhotosChange={(photos) => {
          setTransformationPhotos(photos);
          // Database'e save et
          handleSaveProfile(); // Mevcut save function'ını çağır
        }}
      />
    </div>

    {/* ... rest ... */}
  </div>
);
```

---

## 🧪 Testing Checklist

- [ ] Fotoğraf URL'leri validate ediliyor
- [ ] Önce ve Sonra zorunlu
- [ ] Diğer alanlar opsiyonel
- [ ] Delete işlemi çalışıyor
- [ ] Fotoğraflar database'e kaydediliyor
- [ ] Client profile page'de gösterilmiyor
- [ ] Images yüklenemiyor hatası graceful
- [ ] Form temizleniyor başarıda
- [ ] Loading states doğru

---

## 🚀 Sonraki Adımlar

1. ✅ Bu component'i integrate et
2. Validation'ı strengthen et (image format check)
3. Drag-drop reordering ekle
4. Image compression add (file upload)
5. Before/After carousel'ı enhance et

---

## 📝 Notlar

- JSON formatında depolama PostgreSQL'de sorunsuz çalışıyor
- Frontend'te `Array.isArray()` check yeterli
- Type safety için zod validation kullan
- Images bağlı bir CDN'den geldiğini assume et
