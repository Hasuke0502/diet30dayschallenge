'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // PWAが既にインストールされているかチェック
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = 'standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone
    
    if (isStandalone || (isIOS && isInStandaloneMode)) {
      setIsInstalled(true)
      return
    }

    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      // ブラウザのデフォルトプロンプトを防ぐ
      e.preventDefault()
      
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(beforeInstallPromptEvent)
      
      // 少し遅延してプロンプトを表示（ユーザーエクスペリエンス向上）
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // 3秒後に表示
    }

    // PWAがインストールされた時のイベント
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // ローカルストレージで一度表示したかをチェック
    const hasShownPrompt = localStorage.getItem('pwa-prompt-shown')
    const lastShown = localStorage.getItem('pwa-prompt-last-shown')
    const now = new Date().getTime()
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000 // 3日間

    // 3日経過していれば再度表示を許可
    if (hasShownPrompt && lastShown && (now - parseInt(lastShown) < threeDaysInMs)) {
      setShowPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWAインストール: 受け入れられました')
      } else {
        console.log('PWAインストール: 拒否されました')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
      
      // 表示済みとしてマーク
      localStorage.setItem('pwa-prompt-shown', 'true')
      localStorage.setItem('pwa-prompt-last-shown', new Date().getTime().toString())
    } catch (error) {
      console.error('PWAインストールエラー:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    
    // 一時的に非表示（3日後に再度表示可能）
    localStorage.setItem('pwa-prompt-shown', 'true')
    localStorage.setItem('pwa-prompt-last-shown', new Date().getTime().toString())
  }

  // iOS向けの手動インストールガイド
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  if (isInstalled) {
    return null // PWAが既にインストールされている場合は何も表示しない
  }

  if (!showPrompt && !isIOS) {
    return null // プロンプトを表示しない場合は何も表示しない
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                アプリをインストール
              </h3>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="mt-1 text-xs text-gray-600">
              {isIOS 
                ? 'Safariのメニューからホーム画面に追加できます'
                : 'アプリとしてインストールして、より快適に利用しよう！通知も受け取りやすくなります。'
              }
            </p>
            
            {isIOS ? (
              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <span>1. </span>
                  <span>Safariで</span>
                  <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                  </div>
                  <span>をタップ</span>
                </div>
                <div className="mt-1">
                  <span>2. 「ホーム画面に追加」を選択</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-blue-500 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>インストール</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  後で
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
