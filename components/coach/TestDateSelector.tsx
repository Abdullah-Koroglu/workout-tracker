"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { sendTestPush } from "./TestPush";

export function TestDateSelector({ inline = false }: { inline?: boolean }) {
  const { info, error, success } = useNotificationContext();
  const [testDate, setTestDate] = useState<string | null>(null);
  const [inputDate, setInputDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load current test date
    const loadTestDate = async () => {
      try {
        const response = await fetch("/api/coach/test-date");
        const data = await response.json();
        setTestDate(data.testDate);
        if (data.testDate) {
          setInputDate(data.testDate);
        }
      } catch (err) {
        console.error("Test date yüklenemedi", err);
      }
    };

    loadTestDate();
  }, []);

  const handleSetTestDate = async () => {
    if (!inputDate) {
      error("Lütfen bir tarih seçin.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/coach/test-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: inputDate })
      });

      const data = await response.json();

      if (!response.ok) {
        error(data.error || "Test tarih ayarlanamadı.");
        return;
      }

      setTestDate(data.testDate);
      success("Test tarih ayarlandı! ⏰");
      info("Not: Bu değişiklik sadece test için geçerlidir. Daha sonra sil.");
    } catch (err) {
      error("Bir hata oluştu.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTestDate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/coach/test-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: null })
      });

      const data = await response.json();

      if (!response.ok) {
        error(data.error || "Test tarih temizlenemedi.");
        return;
      }

      setTestDate(null);
      setInputDate("");
      success("Test tarih temizlendi ✓");
    } catch (err) {
      error("Bir hata oluştu.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (inline) {
    return (
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Test Tarihi</p>
            <p className="text-sm text-slate-700">
              {testDate ? `Aktif: ${testDate}` : "Aktif değil"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 py-2 text-sm"
              disabled={loading}
            />
            <Button onClick={handleSetTestDate} disabled={loading || !inputDate} className="text-xs">
              {loading ? "Kaydediliyor..." : "Ayarla"}
            </Button>
            <Button onClick={handleClearTestDate} disabled={loading || !testDate} variant="outline" className="text-xs">
              Temizle
            </Button>
          </div>
        </div>
        <Button onClick={sendTestPush} variant="ghost" className="mt-3">
          Test Push Gönder
        </Button>
      </div>
    );
  }

  // Only show if test date is active or explicitly expanded
  if (!testDate && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-40 text-xs font-medium px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition opacity-40 hover:opacity-100"
      >
        🧪 Test Ayarları
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 rounded-2xl border-2 shadow-lg transition-all ${testDate ? "border-yellow-300 bg-yellow-50" : "border-slate-200 bg-white"}`}
    >
      <Button onClick={sendTestPush} variant="ghost" className="mt-3">
        Test Push Gönder
      </Button>
      <div className={`p-4 ${testDate ? "space-y-3" : "space-y-2"}`}>
        {testDate && (
          <div className="flex items-start gap-3 rounded-xl bg-yellow-100/50 p-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-yellow-900">
                Test Modu Aktif
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                Şu anda <strong>{testDate}</strong> tarihine ayarlandı
              </p>
              <p className="text-xs text-yellow-700 mt-1 italic">
                Bu sadece test amaçlıdır. Canlıya almadan silin!
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-yellow-600 hover:text-yellow-700 flex-shrink-0 mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Test Tarihi Ayarla (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full px-2 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleSetTestDate}
                disabled={loading || !inputDate}
                className="text-xs"
              >
                {loading ? "Kaydediliyor..." : "Ayarla"}
              </Button>

              {testDate && (
                <Button
                  onClick={handleClearTestDate}
                  disabled={loading}
                  variant="outline"
                  className="text-xs"
                >
                  {loading ? "Temizleniyor..." : "Temizle"}
                </Button>
              )}

              {!testDate && (
                <Button
                  onClick={() => setIsExpanded(false)}
                  variant="ghost"
                  className="text-xs"
                >
                  Kapat
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              💡 Bugünü değiştirerek ileriki günlerdeki atamaları görebilirsin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
