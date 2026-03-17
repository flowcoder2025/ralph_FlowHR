import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SkipLink } from "@/components/a11y/SkipLink";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { ToastProvider } from "@/components/layout/Toast";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowHR",
  description: "HR Management Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FlowHR",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <I18nProvider>
            <LiveRegionProvider>
              <ToastProvider>
                <SkipLink />
                <ServiceWorkerRegistration />
                {children}
              </ToastProvider>
            </LiveRegionProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
