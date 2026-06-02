import * as React from "react";

type CoachRequestEmailProps = {
  coachName: string;
  clientName: string;
  dashboardUrl: string;
};

export function CoachRequestEmail({ coachName, clientName, dashboardUrl }: CoachRequestEmailProps) {
  return (
    <html>
      <body style={{ margin: 0, backgroundColor: "#f5f7fb", fontFamily: "Arial, sans-serif", color: "#111827" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#059669", fontWeight: 700 }}>
              Fit Coach
            </p>
            <h1 style={{ margin: "12px 0 8px", fontSize: 24, lineHeight: 1.2 }}>Yeni Client Istegi</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
              Merhaba {coachName}, <strong>{clientName}</strong> sizinle calismak icin yeni bir baglanti istegi gonderdi.
            </p>
            <a
              href={dashboardUrl}
              style={{
                display: "inline-block",
                marginTop: 20,
                backgroundColor: "#059669",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: 999,
                padding: "12px 18px",
                fontWeight: 700,
                fontSize: 14
              }}
            >
              Istegi Goruntule
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

type AssignmentEmailProps = {
  clientName: string;
  coachName: string;
  templateName: string;
  scheduledDateLabel: string;
  dashboardUrl: string;
};

export function AssignmentEmail({
  clientName,
  coachName,
  templateName,
  scheduledDateLabel,
  dashboardUrl
}: AssignmentEmailProps) {
  return (
    <html>
      <body style={{ margin: 0, backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif", color: "#111827" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f766e", fontWeight: 700 }}>
              Fit Coach
            </p>
            <h1 style={{ margin: "12px 0 8px", fontSize: 24, lineHeight: 1.2 }}>Yeni Antrenman Atamasi</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
              Merhaba {clientName}, <strong>{coachName}</strong> sana <strong>{templateName}</strong> antrenmanini
              <strong> {scheduledDateLabel}</strong> gunu icin atadi.
            </p>
            <a
              href={dashboardUrl}
              style={{
                display: "inline-block",
                marginTop: 20,
                backgroundColor: "#0f766e",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: 999,
                padding: "12px 18px",
                fontWeight: 700,
                fontSize: 14
              }}
            >
              Dashboard'a Git
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

type WeeklyDigestCoach = {
  coachName: string;
  weekLabel: string;
  completionRate: number;
  completedCount: number;
  abandonedCount: number;
  activeClients: number;
  prCount: number;
  nutritionAdherenceRate: number;
  atRiskCount: number;
  suggestedActions: string[];
  dashboardUrl: string;
};

export function WeeklyDigestEmail({
  coachName,
  weekLabel,
  completionRate,
  completedCount,
  abandonedCount,
  activeClients,
  prCount,
  nutritionAdherenceRate,
  atRiskCount,
  suggestedActions,
  dashboardUrl
}: WeeklyDigestCoach) {
  return (
    <html>
      <body style={{ margin: 0, backgroundColor: "#f1f5f9", fontFamily: "Arial, sans-serif", color: "#111827" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2563eb", fontWeight: 700 }}>
              Haftalik Ozet
            </p>
            <h1 style={{ margin: "12px 0 8px", fontSize: 24, lineHeight: 1.2 }}>Merhaba {coachName}</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{weekLabel} performans ozeti:</p>

            <div style={{ marginTop: 16, border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 14 }}><strong>Tamamlanma Orani:</strong> %{completionRate}</p>
              <p style={{ margin: "0 0 8px", fontSize: 14 }}><strong>Tamamlanan:</strong> {completedCount}</p>
              <p style={{ margin: "0 0 8px", fontSize: 14 }}><strong>Yarida Birakilan:</strong> {abandonedCount}</p>
              <p style={{ margin: "0 0 8px", fontSize: 14 }}><strong>Aktif Client:</strong> {activeClients}</p>
              <p style={{ margin: "0 0 8px", fontSize: 14 }}><strong>PR:</strong> {prCount}</p>
              <p style={{ margin: "0 0 8px", fontSize: 14 }}><strong>Beslenme Uyumu:</strong> {nutritionAdherenceRate > 0 ? `%${nutritionAdherenceRate}` : "-"}</p>
              <p style={{ margin: 0, fontSize: 14 }}><strong>Riskli Danisan:</strong> {atRiskCount}</p>
            </div>

            {suggestedActions.length > 0 && (
              <div style={{ marginTop: 16, border: "1px solid #ede9fe", borderRadius: 12, padding: 16, backgroundColor: "#f5f3ff" }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6d28d9" }}>Bu haftanin oncelikli aksiyonlari</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#4c1d95", fontSize: 14, lineHeight: 1.6 }}>
                  {suggestedActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            <a
              href={dashboardUrl}
              style={{
                display: "inline-block",
                marginTop: 20,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: 999,
                padding: "12px 18px",
                fontWeight: 700,
                fontSize: 14
              }}
            >
              Coach Panelini Ac
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
