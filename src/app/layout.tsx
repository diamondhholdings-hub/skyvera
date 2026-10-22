import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/ui/nav-bar";
import { Toaster } from "sonner";
import { getFiscalQuarterLabel } from "@/lib/data/server/fiscal-quarter";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Skyvera",
  description: "Portfolio performance, accounts and revenue retention across Skyvera's business units",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <NavBar fiscalQuarter={getFiscalQuarterLabel() || null} />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-md)',
            },
          }}
        />
      </body>
    </html>
  );
}
