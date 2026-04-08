import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "../components/providers/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cocktail-app-zeta-puce.vercel.app"),
  title: "SipNote — 調酒記錄",
  description: "每一杯，都讓你更了解自己。記錄調酒體驗，探索你的口味圖譜。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SipNote",
  },
  openGraph: {
    title: "SipNote — 調酒記錄",
    description: "每一杯，都讓你更了解自己。記錄調酒體驗，探索你的口味圖譜。",
    url: "https://cocktail-app-zeta-puce.vercel.app",
    siteName: "SipNote",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: "/icons/icon.svg",
        width: 512,
        height: 512,
        alt: "SipNote Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SipNote — 調酒記錄",
    description: "每一杯，都讓你更了解自己。記錄調酒體驗，探索你的口味圖譜。",
  },
  keywords: ["調酒", "雞尾酒", "酒吧", "口味", "記錄", "推薦", "cocktail", "bar"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f0f0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <ClientProviders>
          <main className="flex-1 max-w-[430px] mx-auto w-full">{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}
