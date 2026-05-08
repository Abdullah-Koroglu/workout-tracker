"use client";

import { useState } from "react";
import { ArrowRight, Trash2, Upload } from "lucide-react";

export interface TransformationPhoto {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  title: string | null;
}

interface TransformationPhotosManagerProps {
  photos: TransformationPhoto[];
  onPhotosChange: (photos: TransformationPhoto[]) => void;
  isLoading?: boolean;
}

export function TransformationPhotosManager({
  photos,
  onPhotosChange,
  isLoading = false,
}: TransformationPhotosManagerProps) {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const beforePreview = beforeFile ? URL.createObjectURL(beforeFile) : null;
  const afterPreview = afterFile ? URL.createObjectURL(afterFile) : null;

  const handleUpload = async () => {
    if (!beforeFile || !afterFile) {
      setError("Lütfen önce ve sonra resimlerini seçiniz.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("beforeImage", beforeFile);
      formData.append("afterImage", afterFile);
      if (title.trim()) {
        formData.append("title", title.trim());
      }

      const response = await fetch("/api/coach/transformations", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Yükleme başarısız oldu.");
      }

      const data = await response.json();
      onPhotosChange([...photos, data.transformation]);

      setBeforeFile(null);
      setAfterFile(null);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    setDeletingId(photoId);
    setError(null);

    try {
      const response = await fetch(`/api/coach/transformations?id=${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Silme başarısız oldu.");
      }

      onPhotosChange(photos.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="rounded-2xl bg-white p-5 border border-slate-100" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <h3 className="mb-4 text-sm font-black text-slate-800">Dönüşüm Fotoğrafı Ekle</h3>

        <div className="space-y-4">
          {/* Image Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Before Image */}
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-bold text-slate-600">Önce Fotoğrafı</label>
              <div
                className="relative flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer transition-colors hover:bg-slate-100 hover:border-slate-400"
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {beforePreview ? (
                  <img src={beforePreview} alt="Önce" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-xs text-slate-400">Tıklayın</span>
                  </div>
                )}
              </div>
            </div>

            {/* After Image */}
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-bold text-slate-600">Sonra Fotoğrafı</label>
              <div
                className="relative flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer transition-colors hover:bg-slate-100 hover:border-slate-400"
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {afterPreview ? (
                  <img src={afterPreview} alt="Sonra" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-xs text-slate-400">Tıklayın</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-600">Başlık (İsteğe Bağlı)</label>
            <input
              type="text"
              placeholder="örn: 12 Haftalık Dönüşüm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              maxLength={120}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !beforeFile || !afterFile || isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-black text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
          >
            {uploading ? "Yükleniyor..." : "Fotoğrafları Ekle"}
          </button>
        </div>
      </div>

      {/* Gallery Section */}
      {photos.length > 0 && (
        <div className="rounded-2xl bg-white p-5 border border-slate-100" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h3 className="mb-4 text-sm font-black text-slate-800">Dönüşüm Galerisi ({photos.length})</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition-all hover:shadow-md"
              >
                {/* Transformation Images */}
                <div className="relative flex h-40 items-center justify-between overflow-hidden bg-black">
                  {/* Before Image */}
                  <div className="relative h-full flex-1">
                    <img
                      src={photo.beforeUrl}
                      alt="Önce"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white">Önce</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex h-full flex-col items-center justify-center bg-slate-800 px-2">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>

                  {/* After Image */}
                  <div className="relative h-full flex-1">
                    <img
                      src={photo.afterUrl}
                      alt="Sonra"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white">Sonra</span>
                    </div>
                  </div>
                </div>

                {/* Title and Delete */}
                <div className="p-3">
                  {photo.title && (
                    <p className="mb-2 text-sm font-bold text-slate-700 line-clamp-2">{photo.title}</p>
                  )}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={deletingId === photo.id}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === photo.id ? "Siliniyor..." : "Sil"}
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
