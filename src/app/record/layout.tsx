import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '記録入力 | ダイエット30日チャレンジ',
  description: '今日のダイエットの成果を記録して、マネーモンスターにダメージを与えましょう。体重や気分、各ダイエット法の実施状況を記録できます。',
  robots: 'noindex, nofollow',
}

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
