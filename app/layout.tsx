import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ConfirmationProvider } from "@/contexts/ConfirmationContext";
import { AppSessionProvider } from "@/components/shared/SessionProvider";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

export const metadata: Metadata = {
  title: "Fit Coach",
  description: "Coach and client workout tracking platform",
  icons: {
    icon: [{ url: "/favicon.ico" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body className={[  lexend.variable, ""].join(" ")}>
        {/* <ThemeProvider> */}
          <AppSessionProvider>
            <AuthProvider>
              <NotificationProvider>
                <ConfirmationProvider>
                  {/* <Navbar /> */}
                  <main className="mx-auto min-h-[calc(100vh-64px)] bottom-0 m-0">
                    {children}
                  </main>
                </ConfirmationProvider>
              </NotificationProvider>
            </AuthProvider>
          </AppSessionProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
