'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireProfile?: boolean
}

export default function ProtectedRoute({ 
  children, 
  requireProfile = false 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!loading && !isRedirecting) {
      if (!user) {
        setIsRedirecting(true)
        router.replace('/auth/signin')
        return
      }

      if (requireProfile && !profile) {
        setIsRedirecting(true)
        router.replace('/onboarding')
        return
      }

      // プロフィールがあるがチャレンジが必要な場合の処理
      if (profile && !requireProfile) {
        // アクティブなチャレンジがあるかチェック
        // この処理は後で実装
      }
    }
  }, [user, profile, loading, router, requireProfile, isRedirecting])

  // ローディング中またはリダイレクト中は適切なローディング表示
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? '認証情報を確認中...' : 'リダイレクト中...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireProfile && !profile) {
    return null
  }

  return <>{children}</>
}