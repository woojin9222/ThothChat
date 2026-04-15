import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThothChat",
  description: "Next.js 기반 채팅 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
