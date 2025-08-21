import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = {
  title: 'ログイン | ダイエット30日チャレンジ',
  description: 'ダイエット30日チャレンジにログインして、マネーモンスターとの戦いを再開しましょう。',
  robots: 'noindex, nofollow',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <AuthForm mode="signin" />
      </div>
    </div>
  )
}