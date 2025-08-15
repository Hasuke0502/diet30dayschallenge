'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView, trackDietChallengeEvent } from '@/components/GoogleAnalytics'

// ページビュー自動追跡フック
export function usePageTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      trackPageView(url)
    }
  }, [pathname, searchParams])
}

// 滞在時間追跡フック
export function useEngagementTracking(pageName: string, threshold = 30000) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return

    const timer = setTimeout(() => {
      trackDietChallengeEvent.engagedSession(pageName)
    }, threshold)

    return () => clearTimeout(timer)
  }, [pageName, threshold])
}

// ビジビリティ変更追跡（ページを離れる時の追跡）
export function useVisibilityTracking() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // ページを離れる時のイベント
        if (navigator.sendBeacon) {
          trackDietChallengeEvent.engagedSession('page_exit')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}

// カスタムイベントフック
export function useAnalyticsEvents() {
  return trackDietChallengeEvent
}
