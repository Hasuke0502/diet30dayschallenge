'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isRefreshTokenError } from '@/lib/utils'

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
  const [authError, setAuthError] = useState<string | null>(null)

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

  // 認証エラーの監視
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { error } = await supabase.auth.getSession()
        if (error) {
          console.error('認証状態確認エラー:', error)
          if (isRefreshTokenError(error.message)) {
            setAuthError('認証セッションが無効です。再度ログインしてください。')
            // セッションをクリアしてログインページにリダイレクト
            await supabase.auth.signOut()
            router.replace('/auth/signin')
          }
        }
      } catch (error) {
        console.error('認証状態確認エラー:', error)
      }
    }

    // 定期的に認証状態を確認（5分ごと）
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000)
    
    // 初回チェック
    checkAuthStatus()

    return () => clearInterval(interval)
  }, [router])

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

  // 認証エラーが発生した場合
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">認証エラー</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => router.replace('/auth/signin')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ログインページへ
          </button>
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