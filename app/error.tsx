"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="tr" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            background: "linear-gradient(160deg, #0F172A 0%, #1A365D 60%, #0F172A 100%)",
          }}
        >
          {/* Error Card */}
          <div
            style={{
              maxWidth: "450px",
              width: "100%",
              background: "white",
              borderRadius: "24px",
              padding: "40px 32px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              textAlign: "center",
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "72px",
                height: "72px",
                margin: "0 auto 24px",
                borderRadius: "20px",
                background: "rgba(239,68,68,0.1)",
              }}
            >
              <AlertTriangle
                style={{
                  width: "40px",
                  height: "40px",
                  color: "#EF4444",
                }}
              />
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: "#0F172A",
                margin: "0 0 12px",
              }}
            >
              Oops! Bir hata oluştu
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "14px",
                color: "#64748B",
                margin: "0 0 24px",
                lineHeight: "1.6",
              }}
            >
              Uygulamada beklenmedik bir sorun meydana geldi. Lütfen sayfayı yenilemeyi deneyin veya geri dönün.
            </p>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === "development" && error.message && (
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#64748B",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Hata Detayı (Dev):
                </p>
                <code
                  style={{
                    fontSize: "12px",
                    color: "#EF4444",
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                  }}
                >
                  {error.message}
                </code>
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "32px",
              }}
            >
              {/* Refresh Button */}
              <button
                onClick={() => reset()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "48px",
                  width: "100%",
                  borderRadius: "16px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 900,
                  color: "white",
                  background: "linear-gradient(135deg, #FB923C, #EA580C)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(249,115,22,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(249,115,22,0.35)";
                }}
              >
                <RotateCcw style={{ width: "18px", height: "18px" }} />
                Sayfayı Yenile
              </button>

              {/* Back to Home */}
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "48px",
                  width: "100%",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  fontSize: "14px",
                  fontWeight: 900,
                  color: "#475569",
                  background: "white",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.borderColor = "#CBD5E1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
              >
                <Home style={{ width: "18px", height: "18px" }} />
                Ana Sayfaya Dön
              </Link>
            </div>

            {/* Footer Info */}
            <p
              style={{
                fontSize: "12px",
                color: "#94A3B8",
                margin: "24px 0 0",
                paddingTop: "24px",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              Sorun devam ederse, lütfen destek ekibiyle iletişime geçin.
              {error.digest && ` (ID: ${error.digest})`}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
