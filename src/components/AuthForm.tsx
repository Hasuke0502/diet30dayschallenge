'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAuthErrorMessage } from '@/lib/utils'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { useAnalyticsEvents } from '@/hooks/useAnalytics'

interface AuthFormProps {
  mode: 'signin' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const analytics = useAnalyticsEvents()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    console.log('フォーム送信開始:', { mode, email, password: password.length })

    // タイムアウト処理を追加
    const timeoutId = setTimeout(() => {
      console.log('処理がタイムアウトしました')
      setError('処理がタイムアウトしました。ネットワーク接続を確認してください。')
      setLoading(false)
    }, 30000) // 30秒でタイムアウト

    try {
      if (mode === 'signup') {
        console.log('サインアップ処理開始')
        const { error, data } = await auth.signUp(email, password)
        console.log('サインアップ結果:', { error, data })
        if (error) throw error
        clearTimeout(timeoutId)
        // アナリティクス追跡
        analytics.signUp()
        // 確認メールのポップアップを削除し、onboardingページに遷移
        router.replace('/onboarding')
      } else {
        console.log('サインイン処理開始')
        const { error, data } = await auth.signIn(email, password)
        console.log('サインイン結果:', { error, data })
        if (error) throw error
        clearTimeout(timeoutId)
        
        // アナリティクス追跡
        analytics.signIn()
        
        // ログイン成功後、即座にダッシュボードに遷移
        router.replace('/dashboard')
      }
    } catch (error: unknown) {
      console.error('認証エラー:', error)
      clearTimeout(timeoutId)
      
      // エラーメッセージを日本語化
      const errorMessage = getAuthErrorMessage(error instanceof Error ? error : String(error))
      setError(errorMessage)
    } finally {
      clearTimeout(timeoutId)
      // エラーが発生した場合のみローディング状態を解除
      // 成功時は遷移までローディング状態を維持
      if (error) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="mb-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center">
            <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {mode === 'signin' ? 'ログイン' : 'アカウント作成'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          {mode === 'signin' 
            ? 'マネーモンスターとの戦いを再開しましょう！' 
            : 'マネーモンスターを倒す準備はできましたか？'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-base text-black placeholder:text-gray-400"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            パスワード
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-base text-black placeholder:text-gray-400"
              placeholder="パスワードを入力"
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed p-1"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative text-base sm:text-base min-h-[44px]"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
              <span className="text-sm sm:text-base">{mode === 'signin' ? 'ログイン中...' : '作成中...'}</span>
            </div>
          ) : (
            <span className="text-sm sm:text-base">{mode === 'signin' ? 'ログイン' : 'アカウント作成'}</span>
          )}
        </button>
      </form>

      <div className="mt-5 sm:mt-6 text-center">
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          {mode === 'signin' ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}
          <a
            href={mode === 'signin' ? '/auth/signup' : '/auth/signin'}
            className="text-purple-600 hover:text-purple-700 font-medium ml-1 underline"
          >
            {mode === 'signin' ? 'こちら' : 'ログイン'}
          </a>
        </p>
      </div>
    </div>
  )
}