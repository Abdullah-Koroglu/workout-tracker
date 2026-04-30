import Link from "next/link";
import { Search, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
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
          {/* 404 Card */}
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
            {/* 404 Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "72px",
                height: "72px",
                margin: "0 auto 24px",
                borderRadius: "20px",
                background: "rgba(96, 165, 250, 0.1)",
              }}
            >
              <Search
                style={{
                  width: "40px",
                  height: "40px",
                  color: "#3B82F6",
                }}
              />
            </div>

            {/* Error Code */}
            <div
              style={{
                fontSize: "56px",
                fontWeight: 900,
                background: "linear-gradient(135deg, #3B82F6, #1E40AF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: "0 0 12px",
              }}
            >
              404
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
              Sayfa Bulunamadı
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "14px",
                color: "#64748B",
                margin: "0 0 32px",
                lineHeight: "1.6",
              }}
            >
              Aradığınız sayfa mevcut değil veya taşınmış olabilir. Lütfen ana sayfaya dönüp yeniden deneyin.
            </p>

            {/* Action Button */}
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "48px",
                paddingLeft: "32px",
                paddingRight: "32px",
                borderRadius: "16px",
                border: "none",
                fontSize: "14px",
                fontWeight: 900,
                color: "white",
                background: "linear-gradient(135deg, #FB923C, #EA580C)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
                textDecoration: "none",
              }}
            >
              <Home style={{ width: "18px", height: "18px" }} />
              Ana Sayfaya Dön
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </Link>

            {/* Footer */}
            <p
              style={{
                fontSize: "12px",
                color: "#94A3B8",
                margin: "32px 0 0",
                paddingTop: "24px",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              Hala sorununuz varsa, destek ekibiyle iletişime geçin.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
