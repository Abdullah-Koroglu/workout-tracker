import type { Metadata, Viewport } from "next";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ConfirmationProvider } from "@/contexts/ConfirmationContext";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Navbar } from "@/components/shared/Navbar";
import { AppSessionProvider } from "@/components/shared/SessionProvider";
import { GlobalBreadcrumb } from "@/components/shared/GlobalBreadcrumb";
import { NavbarScrollBehavior } from "@/components/shared/NavbarScrollBehavior";
import { PwaRegister } from "@/components/shared/PwaRegister";

export const metadata: Metadata = {
  title: "FitCoach",
  description: "Coach and client workout tracking platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitCoach"
  },
  icons: {
    icon: [
      { url: "/manifest-icon-192.maskable.png", type: "image/png", sizes: "192x192" },
      { url: "/manifest-icon-512.maskable.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon-196.png", type: "image/png", sizes: "196x196" }
    ],
    apple: [{ url: "/apple-icon-180.png", type: "image/png", sizes: "180x180" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#22C55E"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppSessionProvider>
            <AuthProvider>
              <NotificationProvider>
                <ConfirmationProvider>
                  <PwaRegister />
                  <Navbar />
                  <NavbarScrollBehavior />
                  <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-6">
                    <GlobalBreadcrumb />
                    {children}
                  </main>
                </ConfirmationProvider>
              </NotificationProvider>
            </AuthProvider>
          </AppSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
