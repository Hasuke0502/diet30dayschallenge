'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import GameCompletionModal from '@/components/GameCompletionModal'
import { supabase } from '@/lib/supabase'
import { Challenge, DailyRecord, MoneyMonsterData } from '@/types'
import { Skull, Calendar, TrendingDown, Target, Settings, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { getJstYmd, isAfterYmd, formatYmdToJa, addDaysToYmd, calculateRefund, calculateDietSuccessDays, hasAnyDietFailure, unlockNextPlan, checkAdvancedPlanUnrecordedGameOver } from '@/lib/utils'
import { useSound } from '@/hooks/useSound'

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const { playClickSound } = useSound()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [moneyMonsterData, setMoneyMonsterData] = useState<MoneyMonsterData | null>(null)
  const [isGameCompleted, setIsGameCompleted] = useState(false)
  const [unlockedPlan, setUnlockedPlan] = useState<'basic' | 'intermediate' | 'advanced' | null>(null)


  useEffect(() => {
    if (!user || !profile) return

    const fetchChallengeData = async () => {
      try {
        setLoading(true)
        // アクティブなチャレンジを取得
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (challengeError && challengeError.code !== 'PGRST116') {
          throw challengeError
        }

        if (!challengeData) {
          // アクティブなチャレンジがない場合はオンボーディングへ
          router.replace('/onboarding')
          return
        }

        setChallenge(challengeData)

        // 日次記録を取得（必要なカラムのみに絞って軽量化）
        const { data: recordsData, error: recordsError } = await supabase
          .from('daily_records')
          .select('id, record_date, weight, is_completed, created_at, updated_at, challenge_id, mood_comment')
          .eq('challenge_id', challengeData.id)
          .order('record_date', { ascending: false })

        if (recordsError) throw recordsError

        setDailyRecords((recordsData || []) as DailyRecord[])

        // マネーモンスターデータを計算（プラン別）
        const recordedDays = recordsData?.length || 0
        const achievementRate = (recordedDays / 30) * 100
        
        // プラン別の返金額計算
        let recoveredAmount = 0
        switch (challengeData.refund_plan) {
          case 'basic':
            recoveredAmount = calculateRefund(challengeData.participation_fee, 'basic', recordedDays, 0, false)
            break
          
          case 'intermediate':
            const dietSuccessDays = await calculateDietSuccessDays(challengeData.id, supabase)
            recoveredAmount = calculateRefund(challengeData.participation_fee, 'intermediate', recordedDays, dietSuccessDays, false)
            break
          
          case 'advanced':
            const hasFailure = await hasAnyDietFailure(challengeData.id, supabase)
            recoveredAmount = calculateRefund(challengeData.participation_fee, 'advanced', recordedDays, 0, hasFailure)
            break
          
          default:
            recoveredAmount = calculateRefund(challengeData.participation_fee, 'basic', recordedDays, 0, false)
        }
        
        const remainingAmount = challengeData.participation_fee - recoveredAmount

        setMoneyMonsterData({
          maxHealth: challengeData.participation_fee,
          currentHealth: remainingAmount,
          recoveredAmount,
          remainingAmount,
          achievementRate,
        })

        // ゲーム完了チェック（JST基準のYYYY-MM-DD）
        const endYmd = challengeData.end_date
        const todayYmd = getJstYmd()
        
        // 上級プランでの未記録時のゲームオーバー処理
        let gameCompleted = false
        if (challengeData.refund_plan === 'advanced') {
          const isUnrecordedGameOver = await checkAdvancedPlanUnrecordedGameOver(challengeData.id, supabase)
          if (isUnrecordedGameOver) {
            gameCompleted = true
          }
        }
        
        // 通常のゲーム完了条件
        if (!gameCompleted) {
          gameCompleted = isAfterYmd(todayYmd, endYmd) || recordedDays >= 30 || challengeData.status === 'completed'
        }

        if (gameCompleted && challengeData.status !== 'completed') {
          // チャレンジを完了状態に更新
          await supabase
            .from('challenges')
            .update({ status: 'completed' })
            .eq('id', challengeData.id)

          // プラン解放処理
          try {
            const newUnlockedPlan = await unlockNextPlan(
              user.id,
              challengeData.refund_plan,
              supabase
            )
            setUnlockedPlan(newUnlockedPlan)
          } catch (error) {
            console.error('Error unlocking next plan:', error)
          }
        }

        setIsGameCompleted(gameCompleted)

      } catch (error) {
        console.error('Error fetching challenge data:', error)
      } finally {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }

    fetchChallengeData()
  }, [user, profile, router])

  const generateCalendarDays = () => {
    if (!challenge) return []

    const startYmd = challenge.start_date
    const endYmd = challenge.end_date
    const todayYmd = getJstYmd()
    const days = []

    for (let ymd = startYmd; ymd <= endYmd; ymd = addDaysToYmd(ymd, 1)) {
      const dateStr = ymd
      const record = dailyRecords.find(r => r.record_date === dateStr)
      const isFuture = isAfterYmd(dateStr, todayYmd)

      days.push({
        date: dateStr,
        status: isFuture ? 'future' : record ? 'recorded' : 'unrecorded',
        isSuccess: record?.is_completed,
      })
    }

    return days
  }

  const handleSignOut = async () => {
    playClickSound()
    await signOut()
    router.push('/')
  }

  const getToday = () => getJstYmd()

  const hasTodaysRecord = () => {
    const today = getToday()
    return dailyRecords.some(record => record.record_date === today)
  }

  const handleRestartChallenge = async () => {
    if (!user) return
    
    try {
      // 現在のチャレンジを完了状態に更新
      if (challenge) {
        await supabase
          .from('challenges')
          .update({ status: 'completed' })
          .eq('id', challenge.id)
      }

      // モーダルを閉じる
      setIsGameCompleted(false)
      setUnlockedPlan(null)

      // オンボーディングに移動して新しいチャレンジを開始
      router.push('/onboarding')
    } catch (error) {
      console.error('Error restarting challenge:', error)
    }
  }

  const handleFinishChallenge = () => {
    // モーダルを閉じるだけ（チャレンジは完了状態のまま）
    setIsGameCompleted(false)
    setUnlockedPlan(null)
  }



  return (
    <ProtectedRoute requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {isInitialLoad ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">データを読み込み中...</p>
            </div>
          </div>
        ) : (
        <>
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Skull className="w-8 h-8 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  ダイエット30日チャレンジ
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/settings"
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => {
                    playClickSound();
                    handleSignOut();
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* マネーモンスターセクション */}
          {moneyMonsterData && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">マネーモンスターとの戦い</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>モンスターの体力</span>
                      <span className="font-mono">
                        ¥{moneyMonsterData.currentHealth.toLocaleString()} / ¥{moneyMonsterData.maxHealth.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-4">
                      <div 
                        className="bg-white h-4 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${((moneyMonsterData.maxHealth - moneyMonsterData.currentHealth) / moneyMonsterData.maxHealth) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>取り戻した金額: ¥{moneyMonsterData.recoveredAmount.toLocaleString()}</span>
                      <span>達成率: {moneyMonsterData.achievementRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="ml-8">
                  <Skull className="w-24 h-24" />
                </div>
              </div>
            </div>
          )}

          {/* データが読み込まれていない場合の表示 */}
          {!challenge && !loading && (
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">チャレンジ情報を読み込み中...</p>
            </div>
          )}

          {/* チャレンジ情報が読み込まれた場合のみ表示 */}
          

          {challenge && (
            <div className="grid lg:grid-cols-3 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2 space-y-6">
              {/* 今日の記録ボタン */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">今日の記録</h3>
                    <p className="text-gray-600">
                      {hasTodaysRecord() ? '今日の記録は完了しています！' : '今日の記録をつけてマネーモンスターにダメージを与えよう！'}
                    </p>
                  </div>
                  <Link
                    href="/record"
                    onClick={() => playClickSound()}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      hasTodaysRecord()
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    <span>{hasTodaysRecord() ? '記録を確認' : '記録する'}</span>
                  </Link>
                </div>
              </div>

              {/* 進捗統計 */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">記録日数</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dailyRecords.length}/30
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">体重変化</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {challenge && challenge.current_weight && challenge.initial_weight 
                          ? `${(challenge.initial_weight - challenge.current_weight).toFixed(1)}kg`
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-3">
                    <Target className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">達成率</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {moneyMonsterData ? `${moneyMonsterData.achievementRate.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* プラン情報 */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">選択中のプラン</h3>
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-purple-900 text-lg">
                        {challenge?.refund_plan === 'basic' && 'プラン'}
                        {challenge?.refund_plan === 'intermediate' && '中級プラン'}
                        {challenge?.refund_plan === 'advanced' && '上級プラン'}
                      </h4>
                      <p className="text-purple-700 text-sm mt-1">
                        {challenge?.refund_plan === 'basic' && '記録成功日数に応じて返金'}
                        {challenge?.refund_plan === 'intermediate' && 'ダイエット成功日数（全ダイエット法達成日）に応じて返金'}
                        {challenge?.refund_plan === 'advanced' && '厳格ルール：毎日達成で満額返金、失敗で返金なし'}
                      </p>
                      {challenge?.refund_plan === 'intermediate' && (
                        <p className="text-xs text-purple-600 mt-1">
                          ※ ダイエット成功日 = 選択したダイエット法を全て達成した日数
                        </p>
                      )}
                      {challenge?.refund_plan === 'advanced' && (
                        <p className="text-xs text-purple-600 mt-1">
                          ※ 一度でも失敗または未記録で返金対象外
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 最近の記録 */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">最近の記録</h3>
                {dailyRecords.length > 0 ? (
                  <div className="space-y-3">
                    {dailyRecords.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            record.is_completed ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="font-medium">{formatYmdToJa(record.record_date)}</span>
                          {record.weight && (
                            <span className="text-gray-600">{record.weight}kg</span>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          record.is_completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.is_completed ? '記録完了' : '記録済み'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">まだ記録がありません</p>
                )}
              </div>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* チャレンジカレンダー */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">30日間カレンダー</h3>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  {generateCalendarDays().map((day, index) => (
                    <div
                      key={index}
                      className={`p-2 text-center text-xs rounded ${
                        day.status === 'recorded'
                          ? 'bg-green-100 text-green-700'
                          : day.status === 'unrecorded'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {Number(day.date.split('-')[2])}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-100 rounded"></div>
                    <span>記録済み</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-100 rounded"></div>
                    <span>未記録</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <span>未来</span>
                  </div>
                </div>
              </div>

              {/* 目標情報 */}
              {challenge && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">チャレンジ情報</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">開始日</span>
                      <span className="font-medium">{formatYmdToJa(challenge.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">終了日</span>
                      <span className="font-medium">{formatYmdToJa(challenge.end_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">初期体重</span>
                      <span className="font-medium">{challenge.initial_weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">目標体重</span>
                      <span className="font-medium">{challenge.target_weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">参加費</span>
                      <span className="font-medium">¥{challenge.participation_fee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* ゲーム完了モーダル */}
        {isGameCompleted && challenge && moneyMonsterData && (
          <GameCompletionModal
            isOpen={isGameCompleted}
            challenge={challenge}
            moneyMonsterData={moneyMonsterData}
            finalWeight={dailyRecords.length > 0 ? dailyRecords[0]?.weight : null}
            unlockedPlan={unlockedPlan}
            onRestartChallenge={handleRestartChallenge}
            onFinishChallenge={handleFinishChallenge}
          />
        )}
        </>
        )
        }
      </div>
    </ProtectedRoute>
  )
}