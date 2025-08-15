import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";

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
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#3B82F6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://diet-challenge.app' : 'http://localhost:3000'),
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
    // 将来的にGoogle Search Console、Bingウェブマスターツールの認証が必要な場合
    // google: 'your-google-verification-code',
    // other: 'your-other-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen`}
      >
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <AuthProvider>
          {children}
        </AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}