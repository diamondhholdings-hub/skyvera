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
      <body className="font-sans">
        <NavBar />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
