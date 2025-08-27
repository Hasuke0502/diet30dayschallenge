'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { Challenge, DailyRecord } from '@/types'
import { Weight, Target, MessageCircle, CheckCircle, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { getJstYmd, formatYmdToJa, calculateRefund, calculateDietSuccessDays, hasAnyDietFailure, checkAdvancedPlanGameOver } from '@/lib/utils'

interface DietMethodOption {
  id: string
  name: string
  questionText: string
  isCustom: boolean
}

type ChallengeDietMethodJoin = {
  id: string
  diet_method_id: string | null
  custom_diet_method_id: string | null
  diet_methods?: { id: string; name: string; question_text: string } | { id: string; name: string; question_text: string }[] | null
  custom_diet_methods?: { id: string; name: string; question_text: string } | { id: string; name: string; question_text: string }[] | null
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value.length > 0 ? value[0] : null
  return value ?? null
}

export default function RecordPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [dietMethods, setDietMethods] = useState<DietMethodOption[]>([])
  const [existingRecord, setExistingRecord] = useState<DailyRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noActiveChallenge, setNoActiveChallenge] = useState(false)

  // Supabaseクライアントを作成
  const supabase = createClient()

  // フォームデータ
  const [weight, setWeight] = useState('')
  const [dietResults, setDietResults] = useState<Record<string, boolean | null>>({})
  const [moodComment, setMoodComment] = useState('')
  const [counterMeasures, setCounterMeasures] = useState<Record<string, string>>({})

  const today = getJstYmd()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        console.log('🔄 fetchData実行開始')
        // アクティブなチャレンジを取得
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (challengeError) {
          if (challengeError.code === 'PGRST116') {
            // アクティブなチャレンジがない場合は、ページ内で案内表示に切り替える
            setNoActiveChallenge(true)
            return
          }
          throw challengeError
        }

        setChallenge(challengeData)

        // チャレンジに関連するダイエット法を取得（不足があれば自動で紐付け）
        const fetchChallengeDietMethods = async () => {
          const { data, error } = await supabase
            .from('challenge_diet_methods')
            .select(`
              id,
              diet_method_id,
              custom_diet_method_id,
              diet_methods (id, name, question_text),
              custom_diet_methods (id, name, question_text)
            `)
            .eq('challenge_id', challengeData.id)
          if (error) throw error
          return (data || []) as ChallengeDietMethodJoin[]
        }

        let challengeDietMethods: ChallengeDietMethodJoin[] = await fetchChallengeDietMethods()
        console.log('取得されたchallengeDietMethods:', challengeDietMethods.length, challengeDietMethods)

        // 重複レコードをクリーンアップ
        console.log('🧹 重複チェック開始')
        const duplicateGroups = new Map<string, string[]>()
        
        for (const cdm of challengeDietMethods) {
          if (cdm.custom_diet_method_id) {
            const key = cdm.custom_diet_method_id
            if (!duplicateGroups.has(key)) {
              duplicateGroups.set(key, [])
            }
            duplicateGroups.get(key)!.push(cdm.id)
          }
        }

        // 重複があるIDを削除（最初の1つを残す）
        for (const [customMethodId, challengeMethodIds] of duplicateGroups) {
          if (challengeMethodIds.length > 1) {
            console.log(`🗑️ 重複発見: ${customMethodId} (${challengeMethodIds.length}個)`)
            const toDelete = challengeMethodIds.slice(1) // 最初の1つを除いて削除
            console.log('削除対象:', toDelete)
            
            const { error: deleteError } = await supabase
              .from('challenge_diet_methods')
              .delete()
              .in('id', toDelete)
            
            if (deleteError) {
              console.error('重複レコード削除エラー:', deleteError)
            } else {
              console.log('✅ 重複レコードを削除しました')
            }
          }
        }

        // クリーンアップ後に再取得
        challengeDietMethods = await fetchChallengeDietMethods()
        console.log('🔄 クリーンアップ後のchallengeDietMethods:', challengeDietMethods.length, challengeDietMethods)

        // ユーザーのカスタムダイエット法で、まだこのチャレンジに紐付いていないものを自動で追加
        const { data: userCustomMethods, error: customListErr } = await supabase
          .from('custom_diet_methods')
          .select('id, name, question_text')
          .eq('user_id', user.id)
        if (customListErr) throw customListErr

        if (userCustomMethods && userCustomMethods.length > 0) {
          const alreadyLinkedCustomIds = new Set(
            (challengeDietMethods || [])
              .map((cdm: { custom_diet_method_id: string | null }) => cdm.custom_diet_method_id)
              .filter((v: string | null): v is string => Boolean(v))
          )
          const toLink = (userCustomMethods as { id: string }[])
            .filter((m) => !alreadyLinkedCustomIds.has(m.id))
            .map((m) => ({
              challenge_id: challengeData.id,
              custom_diet_method_id: m.id,
            }))

          if (toLink.length > 0) {
            console.log('🔗 新規紐付け:', toLink)
            const { error: linkErr } = await supabase
              .from('challenge_diet_methods')
              .insert(toLink)
            if (linkErr) throw linkErr

            // 再取得して最新の関連を反映
            challengeDietMethods = await fetchChallengeDietMethods()
          }
        }

        // ダイエット法のリストを構築
        const methods: DietMethodOption[] = []
        console.log('ループ開始 - challengeDietMethods配列長:', (challengeDietMethods || []).length)
        let loopCount = 0
        for (const cdm of challengeDietMethods || []) {
          loopCount++
          console.log(`ループ回数: ${loopCount}`)
          const dm = firstOrNull(cdm.diet_methods)
          const cm = firstOrNull(cdm.custom_diet_methods)
          console.log('処理中のcdm:', {
            id: cdm.id,
            diet_method_id: cdm.diet_method_id,
            custom_diet_method_id: cdm.custom_diet_method_id,
            dm,
            cm
          })
          if (cdm.diet_method_id && dm) {
            methods.push({
              id: cdm.id,
              name: dm.name,
              questionText: dm.question_text,
              isCustom: false,
            })
          } else if (cdm.custom_diet_method_id && cm) {
            methods.push({
              id: cdm.id,
              name: cm.name,
              questionText: cm.question_text,
              isCustom: true,
            })
          }
        }
        console.log('ループ終了 - 総ループ回数:', loopCount)
        console.log('構築されたmethods:', methods.length, methods)

        setDietMethods(methods)

        // 今日の記録があるかチェック
        console.log('📅 今日の日付チェック:', today)
        const { data: todayRecord, error: recordError } = await supabase
          .from('daily_records')
          .select(`
            *,
            diet_execution_records (
              challenge_diet_method_id,
              is_successful
            )
          `)
          .eq('challenge_id', challengeData.id)
          .eq('record_date', today)
          .maybeSingle() // singleの代わりにmaybeSingleを使用

        if (recordError && recordError.code !== 'PGRST116') {
          throw recordError
        }

        if (todayRecord) {
          setExistingRecord(todayRecord)
          setWeight(todayRecord.weight?.toString() || '')
          setMoodComment(todayRecord.mood_comment || '')

          // 既存のダイエット実行記録を設定
          const existingDietResults: Record<string, boolean | null> = {}
          if (todayRecord.diet_execution_records) {
            for (const record of todayRecord.diet_execution_records) {
              existingDietResults[record.challenge_diet_method_id] = record.is_successful
            }
          }
          setDietResults(existingDietResults)
          // 既存の対策メモは日次コメントに含めているため、ここでは初期化のみ
          const initialCounters: Record<string, string> = {}
          methods.forEach(method => { initialCounters[method.id] = '' })
          setCounterMeasures(initialCounters)
        } else {
          // 初期値設定（すべてfalse）
          const initialResults: Record<string, boolean | null> = {}
          const initialCounters: Record<string, string> = {}
          methods.forEach(method => {
            initialResults[method.id] = null
            initialCounters[method.id] = ''
          })
          setDietResults(initialResults)
          setCounterMeasures(initialCounters)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        alert('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, today])

  const handleDietResultChange = (methodId: string, result: boolean) => {
    setDietResults(prev => ({
      ...prev,
      [methodId]: result
    }))
    // 「はい」に切り替えた場合は対策メモをクリア
    if (result === true) {
      setCounterMeasures(prev => ({ ...prev, [methodId]: '' }))
    }
  }

  const handleCounterMeasureChange = (methodId: string, value: string) => {
    setCounterMeasures(prev => ({
      ...prev,
      [methodId]: value
    }))
  }

  const handleSave = async () => {
    if (!user || !challenge) return

    setSaving(true)
    try {
      let dailyRecordId = existingRecord?.id

      // 対策メモをまとめる（「いいえ」の項目のみ）
      const failedCounterSummaries = dietMethods
        .filter(m => dietResults[m.id] === false && (counterMeasures[m.id]?.trim()?.length || 0) > 0)
        .map(m => `・${m.name}: ${counterMeasures[m.id].trim()}`)
      const countermeasureSummary = failedCounterSummaries.length > 0
        ? `対策メモ:\n${failedCounterSummaries.join('\n')}`
        : ''

      if (existingRecord) {
        // 既存記録の更新
        const { error: updateError } = await supabase
          .from('daily_records')
          .update({
            weight: weight ? parseFloat(weight) : null,
            mood_comment: (() => {
              const base = moodComment?.trim() || ''
              if (base && countermeasureSummary) return `${base}\n\n${countermeasureSummary}`
              if (!base && countermeasureSummary) return countermeasureSummary
              return base || null
            })(),
            is_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id)

        if (updateError) throw updateError

        // 既存のダイエット実行記録を削除
        const { error: deleteError } = await supabase
          .from('diet_execution_records')
          .delete()
          .eq('daily_record_id', existingRecord.id)

        if (deleteError) throw deleteError
      } else {
        // 新規記録の作成
        const { data: newRecord, error: insertError } = await supabase
          .from('daily_records')
          .insert({
            challenge_id: challenge.id,
            record_date: today,
            weight: weight ? parseFloat(weight) : null,
            mood_comment: (() => {
              const base = moodComment?.trim() || ''
              if (base && countermeasureSummary) return `${base}\n\n${countermeasureSummary}`
              if (!base && countermeasureSummary) return countermeasureSummary
              return base || null
            })(),
            is_completed: true,
          })
          .select()
          .single()

        if (insertError) throw insertError
        dailyRecordId = newRecord.id
      }

      // ダイエット実行記録の作成
      const dietExecutionRecords = Object.entries(dietResults)
        .filter(([, v]) => v !== null)
        .map(([methodId, isSuccessful]) => ({
          daily_record_id: dailyRecordId!,
          challenge_diet_method_id: methodId,
          is_successful: Boolean(isSuccessful),
        }))

      const { error: execError } = await supabase
        .from('diet_execution_records')
        .insert(dietExecutionRecords)

      if (execError) throw execError

      // チャレンジの統計を更新
      const { data: totalRecords, error: countError } = await supabase
        .from('daily_records')
        .select('id')
        .eq('challenge_id', challenge.id)

      if (countError) throw countError

      const recordedDaysCount = (totalRecords?.length || 0) + (existingRecord ? 0 : 1)
      const achievementRate = (recordedDaysCount / 30) * 100

      // プラン別の返金計算
      let refundAmount = 0
      switch (challenge.refund_plan) {
        case 'basic':
          // 初級：記録成功日数ベース
          refundAmount = calculateRefund(challenge.participation_fee, 'basic', recordedDaysCount, 0, false)
          break
        
        case 'intermediate':
          // 中級：ダイエット成功日数ベース
          const dietSuccessDays = await calculateDietSuccessDays(challenge.id, supabase)
          refundAmount = calculateRefund(challenge.participation_fee, 'intermediate', recordedDaysCount, dietSuccessDays, false)
          break
        
        case 'advanced':
          // 上級：失敗があれば0円、全て成功なら満額
          const hasFailure = await hasAnyDietFailure(challenge.id, supabase)
          refundAmount = calculateRefund(challenge.participation_fee, 'advanced', recordedDaysCount, 0, hasFailure)
          break
        
        default:
          refundAmount = calculateRefund(challenge.participation_fee, 'basic', recordedDaysCount, 0, false)
      }

      // 現在の体重も更新
      const updateData: Partial<Challenge> = {
        recorded_days_count: recordedDaysCount,
        achievement_rate: achievementRate,
        refund_amount: refundAmount,
      }

      if (weight) {
        updateData.current_weight = parseFloat(weight)
      }

      const { error: challengeUpdateError } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', challenge.id)

      if (challengeUpdateError) throw challengeUpdateError

      // プラン別の成功メッセージの表示
      const allSuccessful = Object.values(dietResults).every(result => result === true)
      let successMessage = ''
      
      switch (challenge.refund_plan) {
        case 'basic':
          successMessage = allSuccessful
            ? '素晴らしい！今日はダイエット大成功です。明日も頑張ってください！'
            : '今日は目標を達成できませんでしたが、勇気を出して記録したことが重要です！記録を続けることこそが、成功への道筋です。明日も記録を続けましょう！'
          break
        
        case 'intermediate':
          successMessage = allSuccessful
            ? '素晴らしい！今日はダイエット大成功です（ダイエット成功日として記録）。明日も頑張ってください！'
            : '今日は一部のダイエット法で目標を達成できませんでしたが、記録することが重要です。中級プランでは全ダイエット法を達成した日のみが返金対象となります。明日は全て達成を目指しましょう！'
          break
        
        case 'advanced':
          if (allSuccessful) {
            successMessage = '素晴らしい！今日もダイエット大成功です。上級プランでは毎日の達成が重要です。この調子で30日間頑張り続けましょう！'
          } else {
            // 上級プランでの失敗時は即座にゲームオーバー
            const isGameOver = await checkAdvancedPlanGameOver(challenge.id, supabase)
            if (isGameOver) {
              successMessage = 'ゲームオーバー！上級プランでは一度の失敗も許されません。チャレンジは終了です。'
              // ゲームオーバーの場合はダッシュボードにリダイレクト（ゲーム完了ポップアップが表示される）
              alert(successMessage)
              router.push('/dashboard')
              return
            } else {
              successMessage = '今日は目標を達成できませんでした。上級プランでは一度でも失敗があると返金対象外となりますので、明日からより一層気をつけて取り組みましょう！'
            }
          }
          break
        
        default:
          successMessage = allSuccessful
            ? '素晴らしい！今日はダイエット大成功です。明日も頑張ってください！'
            : '今日は目標を達成できませんでしたが、勇気を出して記録したことが重要です！記録を続けることこそが、成功への道筋です。明日も記録を続けましょう！'
      }

      alert(successMessage)
      router.push('/dashboard')

    } catch (error) {
      console.error('Error saving record:', error)
      alert('記録の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const canSave = () => {
    const hasValidWeight = weight !== '' && parseFloat(weight) > 0
    // 「いいえ」を選択した項目は対策メモが必須
    const allCounterMeasuresFilled = dietMethods.every(m => {
      if (dietResults[m.id] == null) return false
      if (dietResults[m.id] === false) {
        return (counterMeasures[m.id]?.trim()?.length || 0) > 0
      }
      return true
    })
    return hasValidWeight && allCounterMeasuresFilled
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (noActiveChallenge) {
    return (
      <ProtectedRoute requireProfile={true}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center">
          <div className="max-w-xl mx-auto px-6 w-full">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">アクティブなチャレンジが見つかりません</h1>
              <p className="text-gray-600 mb-6">
                記録を開始するには、まずオンボーディングから30日チャレンジを作成してください。
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                チャレンジを始める
              </Link>
              <div className="mt-6">
                <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">ダッシュボードに戻る</Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
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
              <h1 className="text-xl font-bold text-gray-900">
                {existingRecord ? '今日の記録を編集' : '今日の記録'}
              </h1>
              <span className="text-sm text-gray-500">{formatYmdToJa(today, true)}</span>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* 体重記録 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Weight className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">今日の体重を記録してください</h2>
              </div>
              <div className="max-w-xs">
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg text-center text-black"
                  placeholder="65.5"
                />
                <p className="text-sm text-gray-500 mt-2 text-center">kg</p>
                {challenge && challenge.target_weight && weight && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-purple-700 text-sm">
                      目標まで: {(parseFloat(weight) - challenge.target_weight).toFixed(1)}kg
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ダイエット法の実行状況 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Target className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900">ダイエット法の実行状況</h2>
              </div>
              <div className="space-y-4">
                {dietMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">{method.questionText}</h3>
                    <div className="flex space-x-4">
                      <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                        dietResults[method.id] === true 
                          ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                          : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-green-50'
                      }`}>
                        <input
                          type="radio"
                          name={`diet-${method.id}`}
                          checked={dietResults[method.id] === true}
                          onChange={() => handleDietResultChange(method.id, true)}
                          className="sr-only"
                        />
                        <CheckCircle className="w-5 h-5" />
                        <span>はい</span>
                      </label>
                      <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                        dietResults[method.id] === false 
                          ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                          : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-red-50'
                      }`}>
                        <input
                          type="radio"
                          name={`diet-${method.id}`}
                          checked={dietResults[method.id] === false}
                          onChange={() => handleDietResultChange(method.id, false)}
                          className="sr-only"
                        />
                        <span>いいえ</span>
                      </label>
                    </div>
                    {dietResults[method.id] === false && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          対策を考えてください
                        </label>
                        <textarea
                          value={counterMeasures[method.id] || ''}
                          onChange={(e) => handleCounterMeasureChange(method.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                          rows={3}
                          placeholder="明日はこうする／避けるために◯◯をする など"
                          maxLength={200}
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">「いいえ」を選んだ場合は必須です（200文字まで）。</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 気分・コメント */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <MessageCircle className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-900">今日の体調や気分はいかがでしたか？</h2>
              </div>
              <textarea
                value={moodComment}
                onChange={(e) => setMoodComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                rows={4}
                placeholder="今日の気分や体調、感じたことを自由に記録してください..."
              />
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-center">
              <button
                onClick={handleSave}
                disabled={!canSave() || saving}
                className="flex items-center space-x-2 px-8 py-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? '保存中...' : existingRecord ? '記録を更新' : '記録を保存'}</span>
              </button>
            </div>

            {/* ナラティブメッセージ */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 text-center">
              <h3 className="text-lg font-bold mb-2">マネーモンスターへの攻撃準備完了！</h3>
              <p className="text-purple-100">
                記録を保存すると、マネーモンスターにダメージを与えてお金を取り戻すことができます。
                毎日の記録こそが勝利への道です！
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}