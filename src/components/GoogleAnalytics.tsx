'use client'

import Script from 'next/script'

interface GoogleAnalyticsProps {
  measurementId: string
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  )
}

// Google Analytics gtag関数の型定義
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// カスタムイベント送信用のユーティリティ関数
export const gtag = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

// よく使用されるイベントのヘルパー関数
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// ページビュー追跡
export const trackPageView = (url: string, title?: string) => {
  gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title,
  })
}

// コンバージョン追跡
export const trackConversion = (conversionId: string, value?: number, currency = 'JPY') => {
  gtag('event', 'conversion', {
    send_to: conversionId,
    value: value,
    currency: currency,
  })
}

// カスタムイベント定義（アプリ固有）
export const trackDietChallengeEvent = {
  // アカウント作成
  signUp: () => trackEvent('sign_up', 'user_engagement'),
  
  // チャレンジ開始
  startChallenge: (plan: string, fee: number) => 
    trackEvent('start_challenge', 'challenge', plan, fee),
  
  // 記録投稿
  submitRecord: (day: number) => 
    trackEvent('submit_record', 'challenge', `day_${day}`),
  
  // チャレンジ完了
  completeChallenge: (plan: string, successRate: number) => 
    trackEvent('complete_challenge', 'challenge', plan, successRate),
  
  // 返金処理
  refundProcessed: (amount: number) => 
    trackEvent('refund_processed', 'payment', undefined, amount),
  
  // お問い合わせ
  contactSubmit: (subject: string) => 
    trackEvent('contact_submit', 'support', subject),
  
  // ページ滞在時間（30秒以上）
  engagedSession: (pageName: string) => 
    trackEvent('engaged_session', 'engagement', pageName),
}
