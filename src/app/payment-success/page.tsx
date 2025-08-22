'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { isOnboardingCompleted } from '@/lib/utils'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { profile } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      // オンボーディング完了済みならダッシュボードへ、未完了ならオンボーディングへ
      const redirectPath = isOnboardingCompleted(profile) ? '/dashboard' : '/onboarding'
      router.replace(redirectPath)
    }, 1500)
    return () => clearTimeout(timer)
  }, [router, profile])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-green-600 text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">決済が完了しました</h1>
        <p className="text-gray-600 mb-6">チャレンジ設定に戻っています…</p>
        <button
          onClick={() => {
            const redirectPath = isOnboardingCompleted(profile) ? '/dashboard' : '/onboarding'
            router.replace(redirectPath)
          }}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          すぐに戻る
        </button>
      </div>
    </div>
  )
}


