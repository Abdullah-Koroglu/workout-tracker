import type { Metadata } from "next";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ConfirmationProvider } from "@/contexts/ConfirmationContext";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Navbar } from "@/components/shared/Navbar";
import { AppSessionProvider } from "@/components/shared/SessionProvider";

export const metadata: Metadata = {
  title: "FitCoach",
  description: "Coach and client workout tracking platform"
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
                  <Navbar />
                  <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-6">{children}</main>
                </ConfirmationProvider>
              </NotificationProvider>
            </AuthProvider>
          </AppSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
