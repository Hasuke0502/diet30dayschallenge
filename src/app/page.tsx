import type { Metadata } from 'next'
import { Skull, Target } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ダイエット30日チャレンジ | マネーモンスターを倒してお金と健康を取り戻そう',
  description: 'お菓子の甘い誘惑から生まれた悪しき存在「マネーモンスター」があなたのお金を奪っている！毎日の記録でマネーモンスターにダメージを与え、お金を取り戻そう！30日間のダイエットチャレンジで健康とお金の両方を手に入れましょう。',
  keywords: 'ダイエット, チャレンジ, 30日, お金, 健康, 記録, マネーモンスター',
  openGraph: {
    title: 'ダイエット30日チャレンジ | マネーモンスターを倒してお金と健康を取り戻そう',
    description: 'お菓子の甘い誘惑から生まれた悪しき存在「マネーモンスター」があなたのお金を奪っている！毎日の記録でマネーモンスターにダメージを与え、お金を取り戻そう！',
    type: 'website',
    locale: 'ja_JP',
    url: 'https://diet-challenge.app',
    siteName: 'ダイエット30日チャレンジ',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@diet_challenge',
    title: 'ダイエット30日チャレンジ',
    description: 'マネーモンスターを倒してお金と健康を取り戻そう！',
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6 sm:mb-8">
          <Skull className="w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 animate-bounce text-white" />
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
          マネーモンスターを倒してお金を取り戻そう！
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
          お菓子の甘い誘惑から生まれた悪しき存在「マネーモンスター」があなたのお金を奪っている！
          毎日の記録でマネーモンスターにダメージを与え、お金を取り戻そう！
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