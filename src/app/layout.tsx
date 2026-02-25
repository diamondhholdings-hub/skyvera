import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/ui/nav-bar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Skyvera Intelligence Platform",
  description: "AI-powered business intelligence for Skyvera portfolio companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'var(--font-body)', background: 'var(--paper)', color: 'var(--ink)' }}>
        <NavBar />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
            },
          }}
        />
      </body>
    </html>
  );
}
