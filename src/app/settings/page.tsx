'use client'

import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, User, Mail, Bell, BellOff, Clock, Target, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useSound } from '@/hooks/useSound'
import { useNotification } from '@/hooks/useNotification'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentDietMethods, savePreferredDietMethods, getPreferredDietMethods } from '@/lib/utils'
import { DietMethod } from '@/types'

// フォールバックのデフォルトダイエット法（オンボーディングと同じ）
const DEFAULT_DIET_METHODS = [
  {
    name: '12時間ファスティング（朝ごはんを抜く）',
    description: '朝ごはんを抜いて12時間の断食を行う',
    question_text: '今日は12時間ファスティングができましたか？',
  },
  {
    name: 'お菓子の代替品を摂取する',
    description: 'お菓子の代わりにナッツなどの健康的な食品を摂取する',
    question_text: '今日はお菓子の代わりに体に良いものを食べましたか？',
  },
  {
    name: 'お酒やジュースの代替品を摂取する',
    description: 'お酒やジュースの代わりに水やお茶を飲む',
    question_text: '今日はお酒やジュースの代わりに水やお茶を飲みましたか？',
  },
  {
    name: '散歩をする',
    description: '散歩などの軽い運動を行う',
    question_text: '今日は散歩をしましたか？',
  },
  {
    name: '7時間以上しっかりと寝る',
    description: '7時間以上の質の良い睡眠を取る',
    question_text: '今日は7時間以上寝ましたか？',
  },
]

const createTempIdFromName = (name: string) => `temp:${name}`

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { playClickSound } = useSound()
  const { 
    status: notificationStatus, 
    isSupported: isNotificationSupported,
    requestPermission,
    scheduleRecordReminder,
    // resetPermission  // 未使用のため無効化
  } = useNotification()
  
  const [recordTime, setRecordTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // ダイエット法関連のstate
  const [dietMethods, setDietMethods] = useState<DietMethod[]>([])
  const [currentDietMethods, setCurrentDietMethods] = useState<{
    defaultMethods: any[]  // eslint-disable-line @typescript-eslint/no-explicit-any
    customMethods: any[]   // eslint-disable-line @typescript-eslint/no-explicit-any
  }>({ defaultMethods: [], customMethods: [] })
  const [selectedDietMethods, setSelectedDietMethods] = useState<string[]>([])
  const [customDietMethods, setCustomDietMethods] = useState<{ name: string; selected: boolean }[]>([])
  const [isDietMethodsSaving, setIsDietMethodsSaving] = useState(false)

  // プロフィール情報から記録時間を取得
  useEffect(() => {
    if (profile?.record_time) {
      setRecordTime(profile.record_time)
    }
  }, [profile])

  // デフォルトダイエット法を取得
  useEffect(() => {
    if (!user) return

    const fetchDietMethods = async () => {
      const { data } = await supabase
        .from('diet_methods')
        .select('*')
        .eq('is_default', true)
        .order('created_at')

      const fetched = (data || []) as DietMethod[]

      // 要件で定義された5件のみを表示。DBになければフォールバックを補完。
      const requiredOrder = DEFAULT_DIET_METHODS.map((d) => d.name)
      const requiredSet = new Set(requiredOrder)

      // DB側から要件名だけ抽出し、同名重複は最初の1件に集約
      const nameToMethod = new Map<string, DietMethod>()
      for (const m of fetched) {
        if (requiredSet.has(m.name) && !nameToMethod.has(m.name)) {
          nameToMethod.set(m.name, m)
        }
      }

      const merged: DietMethod[] = []
      for (const def of DEFAULT_DIET_METHODS) {
        const exist = nameToMethod.get(def.name)
        if (exist) {
          merged.push(exist)
        } else {
          merged.push({
            id: createTempIdFromName(def.name),
            name: def.name,
            description: def.description,
            question_text: def.question_text,
            is_default: true,
            created_at: new Date().toISOString(),
          } as unknown as DietMethod)
        }
      }

      setDietMethods(merged)
    }

    fetchDietMethods()
  }, [user])

  // 現在のチャレンジのダイエット法と好みの設定を取得
  useEffect(() => {
    if (!user) return

    const fetchCurrentAndPreferredSettings = async () => {
      try {
        // 現在のアクティブチャレンジのダイエット法を取得
        const current = await getCurrentDietMethods(user.id, supabase)
        setCurrentDietMethods(current)

        // 保存されている好みの設定を取得
        const preferred = await getPreferredDietMethods(user.id, supabase)
        
        // 現在の設定が優先、なければ好みの設定を使用
        if (current.defaultMethods.length > 0 || current.customMethods.length > 0) {
          // アクティブチャレンジがある場合はそれを表示
          setSelectedDietMethods(current.defaultMethods.map((m: any) => m.id))  // eslint-disable-line @typescript-eslint/no-explicit-any
          setCustomDietMethods(current.customMethods.map((m: any) => ({ name: m.name, selected: true })))  // eslint-disable-line @typescript-eslint/no-explicit-any
        } else {
          // アクティブチャレンジがない場合は好みの設定を表示
          setSelectedDietMethods(preferred.defaultMethods)
          setCustomDietMethods(preferred.customMethods.map(name => ({ name, selected: true })))
        }
      } catch (error) {
        console.error('Error fetching diet method settings:', error)
      }
    }

    fetchCurrentAndPreferredSettings()
  }, [user])

  // 通知許可の切り替え
  const handleToggleNotification = async () => {
    playClickSound()
    
    if (notificationStatus === 'granted') {
      // 通知を無効にする（ブラウザの設定画面に案内）
      alert('通知を無効にするには、ブラウザの設定から変更してください。')
    } else {
      // 通知許可を要求
      await requestPermission()
    }
  }

  // 記録時間の保存
  const handleSaveRecordTime = async () => {
    if (!user || !recordTime) return

    setIsSaving(true)
    playClickSound()

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ record_time: recordTime })
        .eq('id', user.id)

      if (error) throw error

      // 通知が許可されている場合はリマインダーを再設定
      if (notificationStatus === 'granted') {
        scheduleRecordReminder(recordTime)
      }

      alert('記録時間を更新しました')
    } catch (error) {
      console.error('記録時間の更新に失敗しました:', error)
      alert('記録時間の更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // ダイエット法の選択切り替え
  const handleDietMethodToggle = (methodId: string) => {
    setSelectedDietMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    )
  }

  // カスタムダイエット法の追加
  const addCustomDietMethod = () => {
    if (customDietMethods.length < 5) {
      setCustomDietMethods([...customDietMethods, { name: '', selected: true }])
    }
  }

  // カスタムダイエット法の更新
  const updateCustomDietMethod = (index: number, value: string) => {
    const updated = [...customDietMethods]
    updated[index] = { ...updated[index], name: value }
    setCustomDietMethods(updated)
  }

  // カスタムダイエット法の削除
  const removeCustomDietMethod = (index: number) => {
    const updated = customDietMethods.filter((_, i) => i !== index)
    setCustomDietMethods(updated)
  }

  // カスタムダイエット法の選択切り替え
  const toggleCustomDietMethodSelected = (index: number) => {
    const updated = [...customDietMethods]
    updated[index] = { ...updated[index], selected: !updated[index].selected }
    setCustomDietMethods(updated)
  }

  // ダイエット法設定の保存
  const handleSaveDietMethods = async () => {
    if (!user) return

    setIsDietMethodsSaving(true)
    playClickSound()

    try {
      // 選択されたカスタムダイエット法の名前のみを抽出
      const selectedCustomNames = customDietMethods
        .filter(m => m.selected && m.name.trim() !== '')
        .map(m => m.name.trim())

      console.log('Attempting to save diet methods:', {
        user: user.id,
        selectedDietMethods,
        selectedCustomNames
      })

      await savePreferredDietMethods(
        user.id,
        selectedDietMethods,
        selectedCustomNames,
        supabase
      )

      alert('ダイエット法の設定を保存しました。次回チャレンジから適用されます。')
    } catch (error) {
      console.error('ダイエット法設定の保存に失敗しました:', error)
      
      // エラーの詳細を表示
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isColumnError = errorMessage.includes('column') || errorMessage.includes('does not exist')
      
      if (isColumnError) {
        alert('データベースの設定が完了していません。管理者にお問い合わせください。\n\nエラー: ' + errorMessage)
      } else {
        alert('ダイエット法設定の保存に失敗しました。\n\nエラー: ' + errorMessage)
      }
    } finally {
      setIsDietMethodsSaving(false)
    }
  }

  // アクティブチャレンジがあるかチェック
  const hasActiveChallenge = currentDietMethods.defaultMethods.length > 0 || currentDietMethods.customMethods.length > 0



  // 通知状態のテキスト取得
  const getNotificationStatusText = () => {
    if (!isNotificationSupported) return { text: '非対応', color: 'text-gray-500' }
    
    switch (notificationStatus) {
      case 'granted':
        return { text: '許可済み', color: 'text-green-600' }
      case 'denied':
        return { text: '拒否済み', color: 'text-red-600' }
      default:
        return { text: '未設定', color: 'text-yellow-600' }
    }
  }

  return (
    <ProtectedRoute requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">設定</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* プロフィール情報 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">プロフィール情報</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                </div>
                {profile && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        現在の体重
                      </label>
                      <span className="text-gray-900">{profile.current_weight}kg</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        目標体重
                      </label>
                      <span className="text-gray-900">{profile.target_weight}kg</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 通知設定 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Bell className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-900">通知設定</h2>
              </div>
              
              <div className="space-y-6">
                {/* 通知許可状態 */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    {notificationStatus === 'granted' ? (
                      <Bell className="w-5 h-5 text-green-500" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">プッシュ通知</p>
                      <p className="text-sm text-gray-500">記録時間のリマインダーなど</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${getNotificationStatusText().color}`}>
                      {getNotificationStatusText().text}
                    </span>
                    {isNotificationSupported && (
                      <button
                        onClick={handleToggleNotification}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          notificationStatus === 'granted'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {notificationStatus === 'granted' ? '設定変更' : '許可する'}
                      </button>
                    )}
                  </div>
                </div>

                {/* 記録時間設定 */}
                <div className="py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">記録時間</p>
                      <p className="text-sm text-gray-500">毎日記録を促す通知の時間</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="time"
                      value={recordTime}
                      onChange={(e) => setRecordTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSaveRecordTime}
                      disabled={isSaving || !recordTime || recordTime === profile?.record_time}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>

                {/* 注意事項 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 leading-relaxed">
                    <strong>通知について：</strong><br />
                    ・ ブラウザで通知を無効にした場合、ここで再度許可できます<br />
                    ・ 通知は記録時間の前後に送信されます<br />
                    ・ モバイルデバイスでは、ブラウザがバックグラウンドでも動作している必要があります
                  </p>
                </div>
              </div>
            </div>

            {/* ダイエット法設定 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Target className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900">ダイエット法設定</h2>
              </div>

              {hasActiveChallenge && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-700 leading-relaxed">
                    <strong>現在進行中のチャレンジがあります。</strong><br />
                    ここで変更した設定は次回のチャレンジから適用されます。現在のチャレンジには影響しません。
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* デフォルトダイエット法 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">基本のダイエット法</h3>
                  <div className="space-y-3">
                    {dietMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedDietMethods.includes(method.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDietMethods.includes(method.id)}
                          onChange={() => handleDietMethodToggle(method.id)}
                          className="sr-only"
                        />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 text-sm mb-1">{method.name}</div>
                          <div className="text-xs text-gray-600 leading-relaxed">{method.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* カスタムダイエット法 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">カスタムダイエット法</h3>
                  <div className="space-y-3">
                    {customDietMethods.map((method, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-3 border-2 rounded-lg transition-all ${
                          method.selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mr-3"
                          checked={method.selected}
                          onChange={() => toggleCustomDietMethodSelected(index)}
                        />
                        <input
                          type="text"
                          value={method.name}
                          onChange={(e) => updateCustomDietMethod(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="独自のダイエット法を入力"
                          maxLength={50}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            removeCustomDietMethod(index)
                          }}
                          className="p-2 text-red-500 hover:text-red-700 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </label>
                    ))}
                    {customDietMethods.length < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          addCustomDietMethod();
                        }}
                        className="flex items-center space-x-2 text-green-600 hover:text-green-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>新しいダイエット法を追加</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 保存ボタン */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveDietMethods}
                    disabled={isDietMethodsSaving || (selectedDietMethods.length === 0 && customDietMethods.filter(m => m.selected && m.name.trim() !== '').length === 0)}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isDietMethodsSaving ? '保存中...' : 'ダイエット法設定を保存'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    次回チャレンジ開始時に、ここで選択したダイエット法が適用されます
                  </p>
                </div>
              </div>
            </div>

            {/* 法的情報 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">法的情報</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <Link href="/legal/commercial-transactions" className="text-purple-600 hover:text-purple-700">
                    特定商取引法に基づく表記
                  </Link>
                </div>
                <div>
                  <Link href="/legal/privacy-policy" className="text-purple-600 hover:text-purple-700">
                    プライバシーポリシー
                  </Link>
                </div>
                <div>
                  <Link href="/legal/terms" className="text-purple-600 hover:text-purple-700">
                    利用規約
                  </Link>
                </div>
              </div>
            </div>

            {/* アプリ情報 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                ダイエット30日チャレンジ
              </h2>
              <p className="text-gray-600 text-sm">
                Version 1.0.0
              </p>
              <p className="text-gray-500 text-xs mt-2">
                © 2024 ダイエット30日チャレンジ. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}