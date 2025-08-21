'use client'

import { useState, useEffect, useCallback } from 'react'

export type NotificationStatus = 'default' | 'granted' | 'denied'

interface NotificationState {
  status: NotificationStatus
  isSupported: boolean
  isLoading: boolean
}

export const useNotification = () => {
  const [state, setState] = useState<NotificationState>({
    status: 'default',
    isSupported: false,
    isLoading: false,
  })

  // 通知がサポートされているかチェック
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setState(prev => ({
        ...prev,
        isSupported: true,
        status: Notification.permission as NotificationStatus,
      }))
    }
  }, [])

  // 通知許可を要求する関数
  const requestPermission = useCallback(async (): Promise<NotificationStatus> => {
    if (!('Notification' in window)) {
      return 'denied'
    }

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const permission = await Notification.requestPermission()
      setState(prev => ({
        ...prev,
        status: permission as NotificationStatus,
        isLoading: false,
      }))

      // ローカルストレージに保存
      localStorage.setItem('notificationPermission', permission)
      
      return permission as NotificationStatus
    } catch (error) {
      console.error('通知許可の要求に失敗しました:', error)
      setState(prev => ({
        ...prev,
        status: 'denied',
        isLoading: false,
      }))
      return 'denied'
    }
  }, [])

  // Service Workerの登録
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker はサポートされていません')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker が正常に登録されました:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker の登録に失敗しました:', error)
      return null
    }
  }, [])

  // プッシュ通知の購読
  const subscribeToPushNotifications = useCallback(async () => {
    if (state.status !== 'granted') {
      console.warn('通知許可が必要です')
      return null
    }

    try {
      const registration = await registerServiceWorker()
      if (!registration) {
        return null
      }

      // プッシュ通知の購読を行う場合のロジック
      // 実際のVAPIDキーが必要になります
      console.log('プッシュ通知の購読準備完了')
      return registration
    } catch (error) {
      console.error('プッシュ通知の購読に失敗しました:', error)
      return null
    }
  }, [state.status, registerServiceWorker])



  // 通知スケジュールの設定（記録時間に基づく）
  const scheduleRecordReminder = useCallback((recordTime: string) => {
    if (state.status !== 'granted') {
      console.warn('通知許可が必要です')
      return
    }

    // 実際の実装では、Service Workerやサーバーサイドでスケジュール管理を行う
    console.log(`記録リマインダーを${recordTime}に設定しました`)
    
    // ローカルストレージに記録時間を保存
    localStorage.setItem('recordTime', recordTime)
  }, [state.status])

  // 通知許可のリセット（設定から許可を取り消した場合）
  const resetPermission = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'default',
    }))
    localStorage.removeItem('notificationPermission')
  }, [])

  return {
    ...state,
    requestPermission,
    registerServiceWorker,
    subscribeToPushNotifications,
    scheduleRecordReminder,
    resetPermission,
  }
}
