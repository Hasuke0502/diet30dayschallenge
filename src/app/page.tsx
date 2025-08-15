import type { Metadata } from 'next'
import { Skull, Coins, Target, Calendar } from 'lucide-react'
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ダイエット30日チャレンジ",
    "description": "お菓子の甘い誘惑から生まれた悪しき存在「マネーモンスター」があなたのお金を奪っている！毎日の記録でマネーモンスターにダメージを与え、お金を取り戻そう！",
    "url": "https://diet-challenge.app",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY",
      "description": "基本利用は無料、参加費は任意設定"
    },
    "featureList": [
      "30日間のダイエットチャレンジ",
      "日次記録機能",
      "返金システム",
      "ゲーミフィケーション要素",
      "進捗可視化"
    ],
    "author": {
      "@type": "Person",
      "name": "大久保葉介"
    },
    "inLanguage": "ja-JP",
    "keywords": "ダイエット, チャレンジ, 30日, お金, 健康, 記録, マネーモンスター"
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Skull className="w-8 h-8 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">
                ダイエット30日チャレンジ
              </h1>
            </div>
            <div className="space-x-4">
              <Link
                href="/auth/signin"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                始める
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {/* ヒーローセクション */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <Skull className="w-24 h-24 mx-auto mb-6 animate-bounce" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              マネーモンスターを<br />倒してお金を取り戻そう！
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              お菓子の甘い誘惑から生まれた悪しき存在「マネーモンスター」があなたのお金を奪っている！
              毎日の記録でマネーモンスターにダメージを与え、お金を取り戻そう！
            </p>
            <Link
              href="/auth/signup"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <span>今すぐチャレンジを始める</span>
              <Target className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* 特徴セクション */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              ゲームの特徴
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">30日間チャレンジ</h4>
                <p className="text-gray-600">
                  毎日記録をつけるだけで、マネーモンスターにダメージを与えられます。
                  ダイエットが成功した日も、失敗してしまった日も、記録すれば成功日としてカウント！
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Coins className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">金銭的インセンティブ</h4>
                <p className="text-gray-600">
                  参加費を設定し、記録日数に応じて返金を受けられます。
                  継続的なモチベーション維持をサポートします。
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Skull className="w-8 h-8 text-pink-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">ゲーム性とナラティブ</h4>
                <p className="text-gray-600">
                  マネーモンスターとの戦いという楽しいストーリーで、
                  ダイエットを飽きずに続けられます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 仕組みセクション */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              チャレンジの仕組み
            </h3>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">設定とスタート</h4>
                      <p className="text-gray-600">
                        体重目標とダイエット法を選択し、参加費を設定してチャレンジ開始。
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">毎日の記録</h4>
                      <p className="text-gray-600">
                        体重とダイエット法の実行状況を記録。記録するだけでマネーモンスターにダメージ！
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">お金を取り戻す</h4>
                      <p className="text-gray-600">
                        30日間の記録日数に応じて、参加費の一部が返金されます。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="text-center">
                  <Skull className="w-24 h-24 text-purple-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-2">マネーモンスター</h4>
                  <p className="text-gray-600 mb-4">
                    あなたのお菓子代を奪っている悪しき存在。
                    毎日の記録でダメージを与えて、お金を取り戻そう！
                  </p>
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <p className="text-purple-700 font-medium">
                      「このマネーモンスターが、あなたから奪った〇〇円を持っています。
                      さあ、退治してお金を取り戻しましょう！」
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA セクション */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold mb-6">
              あなたも今日からマネーモンスターハンターに！
            </h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              健康的な習慣を身につけながら、お金も取り戻せる一石二鳥のチャレンジです。
            </p>
            <Link
              href="/auth/signup"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <span>無料でアカウント作成</span>
              <Target className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Skull className="w-6 h-6" />
            <span className="font-semibold">ダイエット30日チャレンジ</span>
          </div>
          <p className="text-gray-400">
            © 2024 ダイエット30日チャレンジ. All rights reserved.
          </p>
        </div>
      </footer>
      </div>
    </>
  )
}