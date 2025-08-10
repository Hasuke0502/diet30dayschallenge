'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/signin')
        return
      }

      if (requireProfile && !profile) {
        router.replace('/onboarding')
        return
      }

      // プロフィールがあるがチャレンジが必要な場合の処理
      if (profile && !requireProfile) {
        // アクティブなチャレンジがあるかチェック
        // この処理は後で実装
      }
    }
  }, [user, profile, loading, router, requireProfile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
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