import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Open Health",
  description: "Seu painel de saúde pessoal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <div className="flex" style={{ height: "100dvh" }}>
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-auto" style={{ paddingTop: "var(--mobile-header-h, 0px)" }}>{children}</main>
        </div>
        <style>{`@media (max-width: 767px) { :root { --mobile-header-h: 52px; } }`}</style>
      </body>
    </html>
  );
}
