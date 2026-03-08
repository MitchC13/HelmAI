import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelmAI",
  description: "AI-powered tone intelligence for your team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
