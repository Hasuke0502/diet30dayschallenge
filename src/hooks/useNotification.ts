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
  const scheduleRecordReminder = useCallback(async (recordTime: string) => {
    if (state.status !== 'granted') {
      console.warn('通知許可が必要です')
      return
    }

    try {
      // Service Workerが登録されているかチェック
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
        console.warn('Service Worker が利用できません')
        return
      }

      // 記録時間をローカルストレージに保存
      localStorage.setItem('recordTime', recordTime)

      // 通知をスケジュール（今日の時間が過ぎていれば明日から、そうでなければ今日から）
      const schedules = []
      const now = new Date()
      const [hours, minutes] = recordTime.split(':').map(Number)
      
      // 今日の記録時間
      const todayTime = new Date(now)
      todayTime.setHours(hours, minutes, 0, 0)
      
      // 今日の時間が過ぎているかチェック
      const startDay = now > todayTime ? 1 : 0 // 過ぎていれば明日から、そうでなければ今日から
      
      console.log(`[Notification] スケジュール作成開始:`, {
        currentTime: now.toLocaleString(),
        recordTime: todayTime.toLocaleString(),
        startDay: startDay,
        reason: startDay === 1 ? '今日の記録時間は過ぎているため明日から開始' : '今日の記録時間から開始'
      })
      
      for (let i = startDay; i < startDay + 30; i++) {
        const scheduledDate = new Date(now)
        scheduledDate.setDate(now.getDate() + i)
        scheduledDate.setHours(hours, minutes, 0, 0)
        
        const schedule = {
          id: `record-reminder-day-${i + 1}`,
          title: 'ダイエット記録のお時間です！',
          body: 'マネーモンスターを倒すために、今日の記録をつけましょう！',
          scheduledTime: scheduledDate.toISOString(),
          url: '/record',
          sent: false
        }
        
        schedules.push(schedule)
        console.log(`[Notification] スケジュール作成: Day ${i + 1} - ${scheduledDate.toLocaleString()}`)
      }

      // Service Workerに全てのスケジュールを送信
      for (const schedule of schedules) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          schedule
        })
      }

      console.log(`記録リマインダーを${recordTime}に30日間設定しました`)
      
      // 成功メッセージを表示（任意）
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('通知設定完了', {
          body: `毎日${recordTime}に記録リマインダーをお送りします`,
          icon: '/icon-192.png'
        })
      }
    } catch (error) {
      console.error('通知スケジュールの設定に失敗しました:', error)
    }
  }, [state.status])

  // 通知スケジュールをクリアする関数
  const clearScheduledNotifications = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_SCHEDULES'
        })
        console.log('通知スケジュールをクリアしました')
      }
    } catch (error) {
      console.error('通知スケジュールのクリアに失敗しました:', error)
    }
  }, [])

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
    clearScheduledNotifications,
    resetPermission,
  }
}
