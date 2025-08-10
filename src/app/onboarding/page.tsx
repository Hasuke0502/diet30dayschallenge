'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { DietMethod } from '@/types'
import { Skull, Weight, Target, Clock, Coins, Plus, X, Lock } from 'lucide-react'
import StripePayment from '@/components/StripePayment'
import { getJstYmd, addDaysToYmd } from '@/lib/utils'

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
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
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
  const [showPayment, setShowPayment] = useState(false)
  const [refundPlan, setRefundPlan] = useState<'basic' | 'intermediate' | 'advanced'>('basic')

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

  const handleDietMethodToggle = (methodId: string) => {
    setSelectedDietMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    )
  }

  const handleComplete = async (paymentIntentId?: string) => {
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
          payment_intent_id: paymentIntentId || null,
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
      router.push('/dashboard')
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
    } else if (participationFee > 0) {
      setShowPayment(true)
    } else {
      handleComplete()
    }
  }

  const handlePaymentSuccess = (paymentIntentId?: string) => {
    setShowPayment(false)
    handleComplete(paymentIntentId)
  }

  const handlePaymentError = (error: string) => {
    alert(`決済エラー: ${error}`)
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
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-purple-600">
              ステップ {step} / 4
            </span>
            <span className="text-sm text-gray-500">
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

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="text-center">
              <Weight className="w-16 h-16 text-purple-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                体重目標を設定しましょう
              </h2>
              <p className="text-gray-600 mb-8">
                現在の体重と30日後の目標体重を教えてください
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    現在の体重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="例: 65.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目標体重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="例: 62.0"
                  />
                </div>

                {currentWeight && targetWeight && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-purple-700 font-medium">
                      目標減量: {(parseFloat(currentWeight) - parseFloat(targetWeight)).toFixed(1)}kg
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <Target className="w-16 h-16 text-purple-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ダイエット法を選択しましょう
              </h2>
              <p className="text-gray-600 mb-8">
                挑戦したいダイエット法を選んでください（複数選択可能）
              </p>

              <div className="space-y-4 mb-6">
                {dietMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
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
                      onClick={addCustomDietMethod}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-3">返金プランを選択</h3>
                  <div className="grid gap-3">
                    {/* 初級（選択可能） */}
                    <button
                      type="button"
                      onClick={() => setRefundPlan('basic')}
                      className={`flex items-center p-4 border-2 rounded-lg text-left transition-all w-full ${
                        refundPlan === 'basic' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">初級</div>
                        <div className="text-sm text-gray-600">記録成功日数に応じて返金</div>
                      </div>
                    </button>

                    {/* 中級（未実装・無効） */}
                    <div
                      className="flex items-center p-4 border-2 rounded-lg text-left w-full border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-700">中級（近日対応）</div>
                        <div className="text-sm text-gray-500">選択したダイエット法の達成状況を考慮（実装予定）</div>
                      </div>
                    </div>

                    {/* 上級（未実装・無効） */}
                    <div
                      className="flex items-center p-4 border-2 rounded-lg text-left w-full border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-700">上級（近日対応）</div>
                        <div className="text-sm text-gray-500">1日でも未達成/未記録で返金なし（実装予定）</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      期間
                    </label>
                    <select
                      value={snackPeriod}
                      onChange={(e) => setSnackPeriod(e.target.value as 'day' | 'week' | 'month')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
                  <div className="text-center">
                    <Skull className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      推奨参加費
                    </h3>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      ¥{participationFee.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">
                      この金額をマネーモンスターが奪っています！
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0円でも参加可能です
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <Clock className="w-16 h-16 text-purple-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                記録時間を設定しましょう
              </h2>
              <p className="text-gray-600 mb-8">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  この時間に記録のリマインダーが届きます
                </p>
              </div>

              <div className="mt-8 bg-purple-50 p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-4">設定内容の確認</h3>
                    <div className="space-y-2 text-sm text-gray-600">
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
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              戻る
            </button>
            <button
              onClick={nextStep}
              disabled={!canProceed() || loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '設定中...' : step === 4 ? (participationFee > 0 ? '決済へ進む' : 'チャレンジ開始!') : '次へ'}
            </button>
          </div>
        </div>

        {/* 決済モーダル */}
        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">参加費のお支払い</h3>
                <button
                  onClick={() => setShowPayment(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <StripePayment
                amount={participationFee}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}