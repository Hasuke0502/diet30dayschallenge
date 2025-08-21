'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { DietMethod } from '@/types'
import { Skull, Weight, Target, Clock, Coins, Plus, X, Lock } from 'lucide-react'
import { useSound } from '@/hooks/useSound'
import NotificationPermissionModal from '@/components/NotificationPermissionModal'

import { 
  getJstYmd, 
  addDaysToYmd,
  isPlanUnlocked,
  getPlanDisplayName,
  getUnlockConditionMessage,
  getInitialUnlockedPlans,
  clearUnlockNotification,
  getUnlockNotificationMessage,
  getPreferredDietMethods
} from '@/lib/utils'

// フォールバックのデフォルトダイエット法（DBが空でも提示）
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

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const { playClickSound } = useSound()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // フォームデータ
  const [currentWeight, setCurrentWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [dietMethods, setDietMethods] = useState<DietMethod[]>([])
  const [selectedDietMethods, setSelectedDietMethods] = useState<string[]>([])
  const [customDietMethods, setCustomDietMethods] = useState<{ name: string; selected: boolean }[]>([])
  const [snackPeriod, setSnackPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [snackCount, setSnackCount] = useState('3')
  const [participationFee, setParticipationFee] = useState(0)
  const [recordTime, setRecordTime] = useState('20:00')
  const [refundPlan, setRefundPlan] = useState<'basic' | 'intermediate' | 'advanced'>('basic')
  const [unlockedPlans, setUnlockedPlans] = useState<('basic' | 'intermediate' | 'advanced')[] | null>(null)
  const [showUnlockNotification, setShowUnlockNotification] = useState<'basic' | 'intermediate' | 'advanced' | null>(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)  // eslint-disable-line @typescript-eslint/no-unused-vars

  // プロフィール情報からプラン解放状況を取得
  useEffect(() => {
    if (!user || !profile) return

    // プラン解放状況を設定
    const userUnlockedPlans = profile.unlocked_plans || getInitialUnlockedPlans()
    setUnlockedPlans(userUnlockedPlans)

    // 解放済みプランのうち最初に解放されているプランを選択状態にする
    if (isPlanUnlocked('basic', userUnlockedPlans)) {
      setRefundPlan('basic')
    } else if (isPlanUnlocked('intermediate', userUnlockedPlans)) {
      setRefundPlan('intermediate')
    } else if (isPlanUnlocked('advanced', userUnlockedPlans)) {
      setRefundPlan('advanced')
    }

    // 解放通知があるかチェック
    if (profile.pending_unlock_notification) {
      setShowUnlockNotification(profile.pending_unlock_notification)
    }
  }, [user, profile])

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

      // 好みの設定を読み込んで初期選択状態に反映
      try {
        const preferred = await getPreferredDietMethods(user.id, supabase)
        
        // デフォルトダイエット法の選択状態を設定
        if (preferred.defaultMethods.length > 0) {
          setSelectedDietMethods(preferred.defaultMethods)
        }
        
        // カスタムダイエット法の選択状態を設定
        if (preferred.customMethods.length > 0) {
          setCustomDietMethods(preferred.customMethods.map(name => ({ name, selected: true })))
        }
      } catch (error) {
        console.error('Error loading preferred diet methods:', error)
      }
    }

    fetchDietMethods()
  }, [user])

  // お菓子代から参加費を計算
  useEffect(() => {
    const calculateParticipationFee = () => {
      const count = parseInt(snackCount)
      if (isNaN(count)) return

      let monthlyAmount = 0
      if (snackPeriod === 'day') {
        monthlyAmount = count * 100 * 30
      } else if (snackPeriod === 'week') {
        monthlyAmount = count * 100 * 4
      } else {
        monthlyAmount = count * 100
      }

      // 10の位で四捨五入
      const roundedAmount = Math.round(monthlyAmount / 100) * 100
      setParticipationFee(roundedAmount)
    }

    calculateParticipationFee()
  }, [snackPeriod, snackCount])


  const addCustomDietMethod = () => {
    if (customDietMethods.length < 5) {
      setCustomDietMethods([...customDietMethods, { name: '', selected: true }])
    }
  }

  const updateCustomDietMethod = (index: number, value: string) => {
    const updated = [...customDietMethods]
    updated[index] = { ...updated[index], name: value }
    setCustomDietMethods(updated)
  }

  const removeCustomDietMethod = (index: number) => {
    const updated = customDietMethods.filter((_, i) => i !== index)
    setCustomDietMethods(updated)
  }

  const toggleCustomDietMethodSelected = (index: number) => {
    const updated = [...customDietMethods]
    updated[index] = { ...updated[index], selected: !updated[index].selected }
    setCustomDietMethods(updated)
  }

  // 解放通知を閉じる
  const handleCloseUnlockNotification = async () => {
    if (!user || !showUnlockNotification) return

    try {
      await clearUnlockNotification(user.id, supabase)
      setShowUnlockNotification(null)
    } catch (error) {
      console.error('Failed to clear unlock notification:', error)
    }
  }

  // 通知許可ポップアップのハンドラー
  const handleNotificationAllow = () => {
    setShowNotificationModal(false)
    router.push('/dashboard')
  }

  const handleNotificationDeny = () => {
    setShowNotificationModal(false)
    router.push('/dashboard')
  }

  const handleNotificationLater = () => {
    setShowNotificationModal(false)
    router.push('/dashboard')
  }

  const handleDietMethodToggle = (methodId: string) => {
    setSelectedDietMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    )
  }

  const handleComplete = async () => {
    if (!user) return

    setLoading(true)
    try {
      const safeParseNumber = (v: string) => {
        const n = parseFloat(v)
        return Number.isFinite(n) ? n : null
      }

      const initialW = safeParseNumber(currentWeight)
      const targetW = safeParseNumber(targetWeight)
      if (initialW === null || targetW === null) {
        throw new Error('validation: 体重の値が不正です')
      }

      const throwIfError = (label: string, err: unknown) => {
        if (!err) return
        const e = err as { message?: string; error_description?: string; error?: string }
        const msg = e?.message || e?.error_description || e?.error || JSON.stringify(err)
        throw new Error(`${label}: ${msg}`)
      }

      // プロフィール更新
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          current_weight: initialW,
          target_weight: targetW,
          snack_frequency_period: snackPeriod,
          snack_frequency_count: parseInt(snackCount),
          record_time: recordTime,
          // 新規ユーザーの場合は初期解放プランを設定
          unlocked_plans: unlockedPlans || getInitialUnlockedPlans(),
        })
      throwIfError('profiles.upsert', profileError)

      // カスタムダイエット法の保存（入力されたものは全て保存。選択有無は後の紐付けで使用）
      const enteredCustomNames = Array.from(
        new Set(
          customDietMethods
            .map((m) => m.name.trim())
            .filter((n) => n !== '')
        )
      )

      if (enteredCustomNames.length > 0) {
        // 既存（同名）はスキップして新規のみ挿入
        const { data: existingCustom, error: existingCustomErr } = await supabase
          .from('custom_diet_methods')
          .select('name')
          .eq('user_id', user.id)
          .in('name', enteredCustomNames)
        throwIfError('custom_diet_methods.select(existence)', existingCustomErr)

        const existingNames = new Set((existingCustom || []).map((r: { name: string }) => r.name))
        const toInsert = enteredCustomNames
          .filter((n) => !existingNames.has(n))
          .map((n) => ({
            user_id: user.id,
            name: n,
            question_text: `今日は「${n}」ができましたか？`,
          }))

        if (toInsert.length > 0) {
          const { error: customMethodsError } = await supabase
            .from('custom_diet_methods')
            .insert(toInsert)
          if (customMethodsError) throw customMethodsError
        }
      }

      // この後のチャレンジ紐付け用に「選択されたカスタム法」のみ抽出
      const selectedCustomMethods = customDietMethods.filter((m) => m.selected && m.name.trim() !== '')

      // 既存のアクティブチャレンジを完了扱いにする（単一アクティブを保証）
      await supabase
        .from('challenges')
        .update({ status: 'completed' as 'active' | 'completed' | 'abandoned' })
        .eq('user_id', user.id)
        .eq('status', 'active')

      // チャレンジの作成（JST基準のYYYY-MM-DD）
      const startYmd = getJstYmd()
      const endYmd = addDaysToYmd(startYmd, 30)

      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          user_id: user.id,
          start_date: startYmd,
          end_date: endYmd,
          participation_fee: participationFee,
          refund_plan: refundPlan,
          initial_weight: initialW,
          current_weight: initialW,
          target_weight: targetW,
        })
        .select()
        .single()

      throwIfError('challenges.insert', challengeError)

      // 念のため、作成直後にステータスを 'active' に明示更新（DBデフォルト/型の差異に対応）
      if (challengeData && (challengeData as { status?: string; id: string }).status !== 'active') {
        const { error: statusUpdateError } = await supabase
          .from('challenges')
          .update({ status: 'active' as 'active' | 'completed' | 'abandoned' })
          .eq('id', (challengeData as { id: string }).id)
        throwIfError('challenges.update(status active)', statusUpdateError)
      }

      // ダイエット法とチャレンジの関連付け
      const challengeDietMethods = [] as Array<{
        challenge_id: string
        diet_method_id?: string
        custom_diet_method_id?: string
      }>

      // 選択したデフォルトダイエット法のIDを実DBのIDに解決（足りなければ作成）
      const selectedDefaultMethods = dietMethods.filter((m) => selectedDietMethods.includes(m.id))
      if (selectedDefaultMethods.length > 0) {
        const names = selectedDefaultMethods.map((m) => m.name)

        // 既存取得
        const { data: existingDefaults, error: fetchDefaultErr } = await supabase
          .from('diet_methods')
          .select('id,name')
          .in('name', names)
        throwIfError('diet_methods.select', fetchDefaultErr)

        const nameToId = new Map<string, string>((existingDefaults || []).map((r) => [r.name, r.id]))

        // DBに存在しないデフォルト名は、ユーザーのカスタムダイエット法として作成して紐付ける
        const missingNames = names.filter((nm) => !nameToId.has(nm))
        let missingNameToCustomId = new Map<string, string>()
        if (missingNames.length > 0) {
          const payload = missingNames.map((nm) => {
            const src = selectedDefaultMethods.find((m) => m.name === nm)
            return {
              user_id: user.id,
              name: nm,
              question_text: src?.question_text || `今日は「${nm}」ができましたか？`,
            }
          })
          const { error: createCustomErr } = await supabase
            .from('custom_diet_methods')
            .insert(payload)
          throwIfError('custom_diet_methods.insert(default-fallback)', createCustomErr)

          // 作成した（または既存の）IDを取得
          const { data: createdCustom, error: fetchCreatedCustomErr } = await supabase
            .from('custom_diet_methods')
            .select('id,name')
            .eq('user_id', user.id)
            .in('name', missingNames)
          throwIfError('custom_diet_methods.select(default-fallback)', fetchCreatedCustomErr)

          missingNameToCustomId = new Map<string, string>((createdCustom || []).map((r) => [r.name, r.id]))
        }

        for (const nm of names) {
          const realId = nameToId.get(nm)
          if (realId) {
            challengeDietMethods.push({
              challenge_id: challengeData.id,
              diet_method_id: realId,
            })
          } else {
            const customId = missingNameToCustomId.get(nm)
            if (customId) {
              challengeDietMethods.push({
                challenge_id: challengeData.id,
                custom_diet_method_id: customId,
              })
            }
          }
        }
      }

      // カスタムダイエット法
      if (selectedCustomMethods.length > 0) {
        const { data: customMethods, error: customFetchErr } = await supabase
          .from('custom_diet_methods')
          .select('id')
          .eq('user_id', user.id)
          .in('name', selectedCustomMethods.map(m => m.name.trim()))
        throwIfError('custom_diet_methods.select', customFetchErr)

        if (customMethods) {
          for (const method of customMethods) {
            challengeDietMethods.push({
              challenge_id: challengeData.id,
              custom_diet_method_id: method.id,
            })
          }
        }
      }

      if (challengeDietMethods.length > 0) {
        const { error: relationError } = await supabase
          .from('challenge_diet_methods')
          .insert(challengeDietMethods)
        throwIfError('challenge_diet_methods.insert', relationError)
      }

      await refreshProfile()
      
      // オンボーディング完了フラグを設定して通知許可モーダルを表示
      setOnboardingCompleted(true)
      setShowNotificationModal(true)
    } catch (error) {
      const e = error as { message?: string }
      console.error('Onboarding error:', error)
      alert(e?.message || 'エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }





  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return currentWeight && targetWeight && parseFloat(currentWeight) > parseFloat(targetWeight)
      case 2:
        return (
          selectedDietMethods.length > 0 ||
          customDietMethods.some(m => m.selected && m.name.trim() !== '')
        )
      case 3:
        return snackCount && parseInt(snackCount) >= 0
      case 4:
        return recordTime
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* プラン解放通知 */}
        {showUnlockNotification && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🎉</div>
                <div>
                  <h3 className="font-bold text-purple-900">
                    {getUnlockNotificationMessage(showUnlockNotification)}
                  </h3>
                  <p className="text-sm text-purple-700">
                    新しい難易度のチャレンジに挑戦できるようになりました！
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseUnlockNotification}
                className="text-purple-500 hover:text-purple-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* プログレスバー */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-purple-600">
              ステップ {step} / 4
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {Math.round((step / 4) * 100)}% 完了
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {step === 1 && (
            <div className="text-center">
              <Weight className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                体重目標を設定しましょう
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                現在の体重と30日後の目標体重を教えてください
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    現在の体重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base placeholder:text-gray-400"
                    placeholder="例: 65.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    目標体重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base placeholder:text-gray-400"
                    placeholder="例: 62.0"
                  />
                </div>

                {currentWeight && targetWeight && (
                  <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                    <p className="text-sm sm:text-base text-purple-700 font-medium">
                      目標減量: {(parseFloat(currentWeight) - parseFloat(targetWeight)).toFixed(1)}kg
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <Target className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                ダイエット法を選択しましょう
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                挑戦したいダイエット法を選んでください（複数選択可能）
              </p>

              <div className="space-y-3 sm:space-y-4 mb-6">
                {dietMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-start p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDietMethods.includes(method.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDietMethods.includes(method.id)}
                      onChange={() => handleDietMethodToggle(method.id)}
                      className="sr-only"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 text-sm sm:text-base mb-1">{method.name}</div>
                      <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">{method.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  カスタムダイエット法を追加
                </h3>
                <div className="space-y-3">
                  {customDietMethods.map((method, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-3 border-2 rounded-lg transition-all ${
                        method.selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>新しいダイエット法を追加</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <Coins className="w-16 h-16 text-purple-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                参加費を設定しましょう
              </h2>
              <p className="text-gray-600 mb-8">
                お菓子の消費状況から推奨参加費を算出します
              </p>

              <div className="space-y-6">
                {/* 返金プラン選択 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">レベルを選択</h3>
                  <div className="grid gap-3">
                    {/* 初級プラン */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlanUnlocked('basic', unlockedPlans)) {
                          playClickSound();
                          setRefundPlan('basic');
                        }
                      }}
                      disabled={!isPlanUnlocked('basic', unlockedPlans)}
                      className={`flex items-center p-4 border-2 rounded-lg text-left transition-all w-full ${
                        !isPlanUnlocked('basic', unlockedPlans)
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : refundPlan === 'basic' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isPlanUnlocked('basic', unlockedPlans) && (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {getPlanDisplayName('basic')}
                            {isPlanUnlocked('basic', unlockedPlans) && '（おすすめ）'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {isPlanUnlocked('basic', unlockedPlans) 
                              ? '記録さえできればOK'
                              : getUnlockConditionMessage('basic')
                            }
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* 中級プラン */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlanUnlocked('intermediate', unlockedPlans)) {
                          playClickSound();
                          setRefundPlan('intermediate');
                        }
                      }}
                      disabled={!isPlanUnlocked('intermediate', unlockedPlans)}
                      className={`flex items-center p-4 border-2 rounded-lg text-left transition-all w-full ${
                        !isPlanUnlocked('intermediate', unlockedPlans)
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : refundPlan === 'intermediate' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isPlanUnlocked('intermediate', unlockedPlans) && (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {getPlanDisplayName('intermediate')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {isPlanUnlocked('intermediate', unlockedPlans) 
                              ? 'ダイエット成功日数（全ダイエット法達成日）に応じて返金'
                              : getUnlockConditionMessage('intermediate')
                            }
                          </div>
                          {isPlanUnlocked('intermediate', unlockedPlans) && (
                            <div className="text-xs text-gray-500 mt-1">※ ダイエット成功日＝選択したダイエット法を全て達成した日数</div>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* 上級プラン */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlanUnlocked('advanced', unlockedPlans)) {
                          playClickSound();
                          setRefundPlan('advanced');
                        }
                      }}
                      disabled={!isPlanUnlocked('advanced', unlockedPlans)}
                      className={`flex items-center p-4 border-2 rounded-lg text-left transition-all w-full ${
                        !isPlanUnlocked('advanced', unlockedPlans)
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : refundPlan === 'advanced' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isPlanUnlocked('advanced', unlockedPlans) && (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {getPlanDisplayName('advanced')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {isPlanUnlocked('advanced', unlockedPlans) 
                              ? '厳格ルール：毎日達成で満額返金、失敗で返金なし'
                              : getUnlockConditionMessage('advanced')
                            }
                          </div>
                          {isPlanUnlocked('advanced', unlockedPlans) && (
                            <div className="text-xs text-gray-500 mt-1">※ 一度でも失敗または未記録で返金対象外</div>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      期間
                    </label>
                    <select
                      value={snackPeriod}
                      onChange={(e) => setSnackPeriod(e.target.value as 'day' | 'week' | 'month')}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                    >
                      <option value="day">1日</option>
                      <option value="week">1週間</option>
                      <option value="month">1ヶ月</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お菓子の個数
                    </label>
                    <select
                      value={snackCount}
                      onChange={(e) => setSnackCount(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                    >
                      <option value="0">0個</option>
                      <option value="1">1個</option>
                      <option value="2">2個</option>
                      <option value="3">3個</option>
                      <option value="4">4個</option>
                      <option value="5">5個</option>
                      <option value="10">10個以上</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-lg">
                  <div className="text-center">
                    <Skull className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mx-auto mb-2" />
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                      推奨参加費
                    </h3>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">
                      ¥{participationFee.toLocaleString()}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      この金額をマネーモンスターが奪っています！<br />（※実際の集金はありません）
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    参加費を調整 (任意)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    max="50000"
                    value={participationFee}
                    onChange={(e) => setParticipationFee(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    実際の集金はありません。家族や友人に預かってもらってね！
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                記録時間を設定しましょう
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                毎日記録する時間を設定してください
              </p>

              <div className="max-w-xs mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  記録時間
                </label>
                <input
                  type="time"
                  value={recordTime}
                  onChange={(e) => setRecordTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-base sm:text-lg"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  この時間に記録のリマインダーが届きます
                </p>
              </div>

              <div className="mt-6 sm:mt-8 bg-purple-50 p-4 sm:p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">設定内容の確認</h3>
                <div className="space-y-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                  <p>目標減量: {(parseFloat(currentWeight || '0') - parseFloat(targetWeight || '0')).toFixed(1)}kg</p>
                  <p>選択したダイエット法: {selectedDietMethods.length + customDietMethods.filter(m => m.selected && m.name.trim() !== '').length}個</p>
                  <p>返金プラン: {refundPlan === 'basic' ? '初級（MVP）' : refundPlan === 'intermediate' ? '中級' : '上級'}</p>
                  <p>参加費: ¥{participationFee.toLocaleString()}</p>
                  <p>記録時間: {recordTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex flex-col sm:flex-row justify-between mt-6 sm:mt-8 space-y-3 sm:space-y-0">
            <button
              onClick={() => {
                playClickSound();
                prevStep();
              }}
              disabled={step === 1}
              className="w-full sm:w-auto px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium min-h-[44px]"
            >
              戻る
            </button>
            <button
              onClick={() => {
                playClickSound();
                nextStep();
              }}
              disabled={!canProceed() || loading}
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium min-h-[44px]"
            >
              {loading ? '設定中...' : step === 4 ? 'チャレンジ開始!' : '次へ'}
            </button>
          </div>
        </div>


      </div>

      {/* 通知許可ポップアップ */}
      <NotificationPermissionModal
        isOpen={showNotificationModal}
        onClose={handleNotificationLater}
        onAllow={handleNotificationAllow}
        onDeny={handleNotificationDeny}
        recordTime={recordTime}
      />
    </div>
  )
}