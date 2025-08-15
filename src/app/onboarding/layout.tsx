import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'チャレンジ設定 | ダイエット30日チャレンジ',
  description: 'あなたのダイエット目標を設定し、マネーモンスターとの戦いを始めましょう。参加費と返金プランを選択して、モチベーションを維持しながらダイエットに取り組めます。',
  robots: 'noindex, nofollow',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
