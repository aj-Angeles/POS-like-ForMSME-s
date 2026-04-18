import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MSME POS",
  description: "Point-of-sale & business management for MSMEs.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh bg-background">{children}</body>
    </html>
  );
}
