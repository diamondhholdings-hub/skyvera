import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
