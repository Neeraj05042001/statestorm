import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "StateStorm — Adversarial UI preflight",
  description:
    "Turn React component requirements into adversarial states and deterministic browser evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
