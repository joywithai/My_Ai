import type { Metadata, Viewport } from "next";
import "./globals.css";
import ToastHost from "@/components/ToastHost";

export const metadata: Metadata = {
  title: "MyAi — AI Avatar Companion",
  description: "Talk with your 3D AI avatar — Bangla & English",
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className="dark">
      <body className="min-h-dvh font-sans antialiased">
        <div className="relative z-10">{children}</div>
        <ToastHost />
      </body>
    </html>
  );
}
