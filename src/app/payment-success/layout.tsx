import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '決済完了 | ダイエット30日チャレンジ',
  description: '決済が正常に完了しました。チャレンジの設定を継続してください。',
  robots: 'noindex, nofollow',
}

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
