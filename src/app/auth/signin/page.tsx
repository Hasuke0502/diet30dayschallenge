import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = {
  title: 'ログイン | ダイエット30日チャレンジ',
  description: 'ダイエット30日チャレンジにログインして、マネーモンスターとの戦いを再開しましょう。',
  robots: 'noindex, nofollow',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthForm mode="signin" />
    </div>
  )
}