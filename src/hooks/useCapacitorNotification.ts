'use client'

import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export type CapacitorNotificationStatus = 'default' | 'granted' | 'denied'

interface CapacitorNotificationState {
  status: CapacitorNotificationStatus
  isSupported: boolean
  isLoading: boolean
}

export const useCapacitorNotification = () => {
  const [state, setState] = useState<CapacitorNotificationState>({
    status: 'default',
    isSupported: false,
    isLoading: false,
  })

  // 許可状態をチェック
  const checkPermissionStatus = useCallback(async () => {
    try {
      const status = await LocalNotifications.checkPermissions()
      setState(prev => ({
        ...prev,
        status: status.display as CapacitorNotificationStatus,
      }))
    } catch (error) {
      console.error('通知許可状態の確認に失敗しました:', error)
    }
  }, [])

  // Capacitorがサポートされているかチェック
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setState(prev => ({
        ...prev,
        isSupported: true,
      }))
      
      // 既存の許可状態をチェック
      checkPermissionStatus()
    }
  }, [checkPermissionStatus])

  // 通知許可を要求する関数
  const requestPermission = useCallback(async (): Promise<CapacitorNotificationStatus> => {
    if (!Capacitor.isNativePlatform()) {
      console.warn('ネイティブプラットフォームではありません')
      return 'denied'
    }

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const permission = await LocalNotifications.requestPermissions()
      const status = permission.display as CapacitorNotificationStatus
      
      setState(prev => ({
        ...prev,
        status: status,
        isLoading: false,
      }))

      return status
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

  // ローカル通知をスケジュール
  const scheduleRecordReminder = useCallback(async (recordTime: string) => {
    if (state.status !== 'granted') {
      console.warn('通知許可が必要です')
      return
    }

    try {
      // 既存の通知をクリア
      await LocalNotifications.cancel({ notifications: [] })

      const now = new Date()
      const [hours, minutes] = recordTime.split(':').map(Number)
      
      // 今日の記録時間
      const todayTime = new Date(now)
      todayTime.setHours(hours, minutes, 0, 0)
      
      // 今日の時間が過ぎているかチェック
      const startDay = now > todayTime ? 1 : 0
      
      console.log(`[Capacitor] スケジュール作成開始:`, {
        currentTime: now.toLocaleString(),
        recordTime: todayTime.toLocaleString(),
        startDay: startDay,
      })

      const notifications = []
      
      for (let i = startDay; i < startDay + 30; i++) {
        const scheduledDate = new Date(now)
        scheduledDate.setDate(now.getDate() + i)
        scheduledDate.setHours(hours, minutes, 0, 0)
        
        notifications.push({
          id: i + 1,
          title: 'ダイエット記録のお時間です！',
          body: 'マネーモンスターを倒すために、今日の記録をつけましょう！',
          schedule: {
            at: scheduledDate,
            repeats: false,
          },
          sound: 'default',
          actionTypeId: 'RECORD_ACTION',
          extra: {
            url: '/record'
          }
        })
      }

      await LocalNotifications.schedule({
        notifications: notifications
      })

      console.log(`[Capacitor] ${notifications.length}件の通知をスケジュールしました`)
    } catch (error) {
      console.error('通知スケジュールの設定に失敗しました:', error)
    }
  }, [state.status])

  // すべての通知をクリア
  const clearScheduledNotifications = useCallback(async () => {
    try {
      const pending = await LocalNotifications.getPending()
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ 
          notifications: pending.notifications.map(n => ({ id: n.id }))
        })
        console.log(`[Capacitor] ${pending.notifications.length}件の通知をクリアしました`)
      }
    } catch (error) {
      console.error('通知クリアに失敗しました:', error)
    }
  }, [])

  // 即座に通知を送信
  const sendTestNotification = useCallback(async () => {
    if (state.status !== 'granted') {
      console.warn('通知許可が必要です')
      return
    }

    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: 9999,
          title: 'テスト通知',
          body: 'Capacitorからのテスト通知です。この通知が表示されれば、ネイティブ通知は正常に動作しています。',
          schedule: {
            at: new Date(Date.now() + 1000), // 1秒後
          },
          sound: 'default'
        }]
      })
      console.log('[Capacitor] テスト通知を送信しました')
    } catch (error) {
      console.error('テスト通知の送信に失敗しました:', error)
    }
  }, [state.status])

  return {
    ...state,
    requestPermission,
    scheduleRecordReminder,
    clearScheduledNotifications,
    sendTestNotification,
    checkPermissionStatus,
  }
}
