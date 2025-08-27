'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Skull, Target } from 'lucide-react'
import Link from 'next/link'
import { isOnboardingCompleted } from '@/lib/utils'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return

    // ログイン済みユーザーの場合
    if (user) {
      // プロフィールの読み込み待ち
      if (profile === null) {
        console.log('プロフィール読み込み待機中...')
        return
      }

      // オンボーディングが完了していない場合
      if (!isOnboardingCompleted(profile)) {
        console.log('オンボーディングへリダイレクト')
        router.replace('/onboarding')
        return
      }

      // オンボーディング完了済みの場合、ダッシュボードへリダイレクト
      console.log('ダッシュボードへリダイレクト')
      router.replace('/dashboard')
    }
  }, [user, profile, loading, router])

  // ローディング中またはログイン済みユーザーには何も表示しない
  if (loading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center">
        <div className="text-center">
          <Skull className="w-16 h-16 mx-auto mb-4 animate-bounce text-white" />
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未ログインユーザーにランディングページを表示
  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6 sm:mb-8">
          <Skull className="w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 animate-bounce text-white" />
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
          最高のダイエット習慣をつけよう！
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
        頑張っているのにダイエットが成功しない。」同僚から毎日のように相談されます。私は過去に12kgのダイエットに成功しました。しかし努力なんていらないんです。大切なことは「習慣作り」1択です。あなたもそんな習慣をみにつけて、ダイエットを今度こそ成功させませんか？
        </p>
        <Link
          href="/auth/signup"
          className="bg-white text-purple-600 px-8 sm:px-12 py-4 sm:py-6 rounded-lg text-lg sm:text-xl font-bold hover:bg-gray-100 transition-colors inline-flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span>今すぐチャレンジを始める</span>
          <Target className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
      </div>
    </div>
  )
}