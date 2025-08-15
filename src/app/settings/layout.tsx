import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '設定 | ダイエット30日チャレンジ',
  description: 'アカウント設定や音響設定の変更、お問い合わせができます。',
  robots: 'noindex, nofollow',
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
