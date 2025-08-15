'use client'

import { useState, useEffect } from 'react'
import { X, Cookie } from 'lucide-react'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
    
    // Google Analyticsを有効化
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && typeof window !== 'undefined') {
      ;(window as any).gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
  }

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShowBanner(false)
    
    // Google Analyticsを無効化
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && typeof window !== 'undefined') {
      ;(window as any).gtag('consent', 'update', {
        analytics_storage: 'denied'
      })
    }
  }

  if (!mounted || !showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Cookie className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Cookieの使用について
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                当サイトでは、サービスの改善とユーザー体験の向上のためにCookieを使用しています。
                継続してご利用いただく場合、Cookieの使用に同意いただいたものとします。
                詳しくは
                <a 
                  href="/legal/privacy-policy" 
                  className="text-purple-600 hover:text-purple-700 underline mx-1"
                >
                  プライバシーポリシー
                </a>
                をご確認ください。
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={acceptCookies}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  同意する
                </button>
                <button
                  onClick={declineCookies}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                >
                  拒否する
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={declineCookies}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Cookie バナーを閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
