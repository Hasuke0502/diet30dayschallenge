import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ダッシュボード | ダイエット30日チャレンジ',
  description: 'マネーモンスターとの戦いの進捗を確認し、日々の記録を管理しましょう。',
  robots: 'noindex, nofollow',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
