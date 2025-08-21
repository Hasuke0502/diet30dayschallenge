'use client'

import { useState } from 'react'
// import { useRouter } from 'next/navigation'
import { Challenge, MoneyMonsterData } from '@/types'
import { Skull, Trophy, Target, TrendingDown, Coins } from 'lucide-react'
import { getPlanDisplayName } from '@/lib/utils'

interface GameCompletionModalProps {
  isOpen: boolean
  challenge: Challenge
  moneyMonsterData: MoneyMonsterData
  finalWeight: number | null
  unlockedPlan?: 'basic' | 'intermediate' | 'advanced' | null
  onRestartChallenge: () => void
  onFinishChallenge: () => void
}

export default function GameCompletionModal({
  isOpen,
  challenge,
  moneyMonsterData,
  finalWeight,
  unlockedPlan,
  onRestartChallenge,
  onFinishChallenge,
}: GameCompletionModalProps) {
  const [isRestarting, setIsRestarting] = useState(false)
  // const router = useRouter()

  if (!isOpen) return null

  const getResultMessage = () => {
    // 上級プランでの失敗時の特別メッセージ
    if (challenge.refund_plan === 'advanced' && challenge.refund_amount === 0) {
      return 'ゲームオーバー！上級プランでは一度の失敗も許されません。'
    }
    
    const rate = moneyMonsterData.achievementRate
    if (rate === 100) {
      return '完全勝利！マネーモンスターを完全に倒しました！'
    } else if (rate >= 75) {
      return '大勝利！マネーモンスターに大ダメージを与えました！'
    } else if (rate >= 50) {
      return '勝利！マネーモンスターとの戦いに勝ちました！'
    } else if (rate >= 25) {
      return '健闘！記録を続けた努力は素晴らしいです！'
    } else {
      return 'チャレンジ参加ありがとうございました。次回はきっと良い結果になります！'
    }
  }

  const getWeightChange = () => {
    if (!challenge.initial_weight || !finalWeight) return null
    return challenge.initial_weight - finalWeight
  }

  const handleRestart = async () => {
    setIsRestarting(true)
    await onRestartChallenge()
    setIsRestarting(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="mb-4">
              {challenge.refund_plan === 'advanced' && challenge.refund_amount === 0 ? (
                <Skull className="w-16 h-16 text-red-600 mx-auto" />
              ) : moneyMonsterData.achievementRate >= 50 ? (
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
              ) : (
                <Skull className="w-16 h-16 text-purple-600 mx-auto" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {challenge.refund_plan === 'advanced' && challenge.refund_amount === 0 
                ? '上級プランチャレンジが終了しました！'
                : '30日間のダイエットチャレンジが完了しました！'
              }
            </h2>
            <p className="text-xl font-medium text-purple-600">
              {challenge.refund_plan === 'advanced' && challenge.refund_amount === 0 
                ? '残念ながらゲームオーバーです...'
                : 'お疲れ様でした！'
              }
            </p>
          </div>

          {/* 戦闘結果 */}
          <div className={`rounded-xl p-6 mb-6 ${
            challenge.refund_plan === 'advanced' && challenge.refund_amount === 0
              ? 'bg-gradient-to-r from-red-50 to-pink-50'
              : 'bg-gradient-to-r from-purple-50 to-pink-50'
          }`}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              マネーモンスターとの戦いの結果
            </h3>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${
                challenge.refund_plan === 'advanced' && challenge.refund_amount === 0
                  ? 'text-red-600'
                  : 'text-purple-600'
              }`}>
                {getResultMessage()}
              </div>
              <Skull className={`w-20 h-20 mx-auto mb-4 ${
                challenge.refund_plan === 'advanced' && challenge.refund_amount === 0
                  ? 'text-red-600'
                  : 'text-purple-600'
              }`} />
            </div>
          </div>

          {/* 具体的な数値結果 */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">記録成功日数</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                30日中{challenge.recorded_days_count}日記録を続けました
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">達成率</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                達成率{moneyMonsterData.achievementRate.toFixed(1)}%
              </p>
            </div>

            {getWeightChange() !== null && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-gray-900">体重変化</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  開始時{challenge.initial_weight}kg → 最終{finalWeight}kg
                  （{getWeightChange()!.toFixed(1)}kg減量）
                </p>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-900">取り戻した金額</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {challenge.refund_plan === 'advanced' && challenge.refund_amount === 0
                  ? '¥0（ゲームオーバーのため返金対象外）'
                  : `¥${moneyMonsterData.recoveredAmount.toLocaleString()}を取り戻しました`
                }
              </p>
            </div>
          </div>

          {/* 返金に関する案内 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 text-center">
              {challenge.refund_plan === 'advanced' && challenge.refund_amount === 0
                ? '※ 上級プランでは一度でも失敗があると返金対象外となります。次回は初級・中級プランから始めて、徐々に難易度を上げることをお勧めします。'
                : '※ 返金の処理には、銀行営業日で3〜5日程度お時間をいただく場合がございます。返金が完了次第、登録されたメールアドレスにご連絡いたします。'
              }
            </p>
          </div>

          {/* プラン解放通知 */}
          {unlockedPlan && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  新しいチャレンジプランが解放されました！
                </h3>
                <p className="text-purple-700 font-medium">
                  次回は{getPlanDisplayName(unlockedPlan)}プランに挑戦できます！
                </p>
                <p className="text-sm text-purple-600 mt-2">
                  より高い難易度で自分に挑戦してみましょう！
                </p>
              </div>
            </div>
          )}

          {/* アクション選択 */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleRestart}
              disabled={isRestarting}
              className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isRestarting ? '準備中...' : 'もう一度チャレンジする'}
            </button>
            <button
              onClick={onFinishChallenge}
              className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              今回は終了する
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}