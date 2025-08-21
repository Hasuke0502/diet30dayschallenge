'use client'

import { useState } from 'react'
import { Bell, X, Clock, Target, Sparkles } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { useSound } from '@/hooks/useSound'

interface NotificationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onAllow: () => void
  onDeny: () => void
  recordTime?: string
}

export default function NotificationPermissionModal({
  isOpen,
  onClose,
  onAllow,
  onDeny,
  recordTime,
}: NotificationPermissionModalProps) {
  const { requestPermission, scheduleRecordReminder } = useNotification()
  const { playClickSound } = useSound()
  const [isRequesting, setIsRequesting] = useState(false)

  if (!isOpen) return null

  const handleAllow = async () => {
    setIsRequesting(true)
    playClickSound()

    try {
      const result = await requestPermission()
      
      if (result === 'granted') {
        // 記録時間が設定されている場合はリマインダーをスケジュール
        if (recordTime) {
          scheduleRecordReminder(recordTime)
        }
        onAllow()
      } else {
        onDeny()
      }
    } catch (error) {
      console.error('通知許可の要求に失敗しました:', error)
      onDeny()
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDeny = () => {
    playClickSound()
    onDeny()
  }

  const handleLater = () => {
    playClickSound()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-in fade-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleLater}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isRequesting}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-yellow-800" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              通知を許可して成功率アップ！
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              ダイエットの成功には継続が大切です。<br />
              通知を許可することで記録を忘れずに続けられます。
            </p>
          </div>
        </div>

        {/* 特徴説明 */}
        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">記録時間のリマインダー</p>
                <p className="text-xs text-gray-600">設定した時間に記録を促す通知が届きます</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">目標達成のサポート</p>
                <p className="text-xs text-gray-600">モチベーション維持に役立つメッセージをお届け</p>
              </div>
            </div>
          </div>
        </div>

        {/* 記録時間の表示 */}
        {recordTime && (
          <div className="mx-6 mb-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700 text-center">
              <Clock className="w-4 h-4 inline mr-1" />
              {recordTime} に記録リマインダーをお送りします
            </p>
          </div>
        )}

        {/* ボタン */}
        <div className="p-6 pt-2 space-y-3">
          <button
            onClick={handleAllow}
            disabled={isRequesting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                許可を確認中...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                通知を許可する
              </>
            )}
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDeny}
              disabled={isRequesting}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              許可しない
            </button>
            <button
              onClick={handleLater}
              disabled={isRequesting}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              後で設定
            </button>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            通知は設定から後で変更できます。<br />
            ブラウザによって表示される許可ダイアログで「許可」を選択してください。
          </p>
        </div>
      </div>
    </div>
  )
}

// アニメーション用のCSS（globals.cssに追加する必要があります）
export const notificationModalStyles = `
@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-in {
  animation: animate-in 0.3s ease-out;
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

.slide-in-from-bottom-4 {
  animation: slide-in-from-bottom-4 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-bottom-4 {
  from { transform: translateY(16px); }
  to { transform: translateY(0); }
}
`
