import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ダイエット30日チャレンジ",
  description: "マネーモンスターを倒してお金と健康を取り戻そう！",
  icons: {
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_SITE_URL || 'https://diet-challenge.app' : 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "ダイエット30日チャレンジ",
    description: "マネーモンスターを倒してお金と健康を取り戻そう！",
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ダイエット30日チャレンジ",
    description: "マネーモンスターを倒してお金と健康を取り戻そう！",
  },
  verification: {
    // Google Search Consoleの認証コード
    google: 'google3c6060e22735228f',
    // 将来的にBingウェブマスターツールの認証が必要な場合
    // other: 'your-other-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // ユーザーがズームできるようにする
  minimumScale: 1,
  userScalable: true, // ユーザーがズームできるようにする
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <AuthProvider>
          {children}
        </AuthProvider>
        <CookieBanner />
        <ServiceWorkerRegister />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}