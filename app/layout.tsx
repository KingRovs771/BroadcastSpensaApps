import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/shared/SessionContext";

export const metadata: Metadata = {
  title: "Broadcast Spensa OS · Unified Production & Management",
  description:
    "Sistem Operasi Ekstrakurikuler & Manajemen Produksi Media SMP Negeri 1 Spensa berstandar Silicon Valley.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo/BC_DONE.png",
    apple: "/logo/BC_DONE.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#070D1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-cosmic text-white antialiased min-h-screen selection:bg-orbital-violet selection:text-ink">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
