import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = {
  title: 'アカウント登録 | ダイエット30日チャレンジ',
  description: 'ダイエット30日チャレンジに参加して、マネーモンスターを倒しお金と健康を取り戻しましょう。アカウント登録は無料です。',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'アカウント登録 | ダイエット30日チャレンジ',
    description: 'マネーモンスターを倒しお金と健康を取り戻そう！今すぐ参加登録',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'アカウント登録 | ダイエット30日チャレンジ',
    description: 'マネーモンスターを倒しお金と健康を取り戻そう！',
  },
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <AuthForm mode="signup" />
      </div>
    </div>
  )
}