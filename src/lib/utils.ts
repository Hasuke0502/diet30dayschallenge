import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SupabaseClient } from '@supabase/supabase-js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 認証エラーメッセージを日本語化する関数
export function getAuthErrorMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message
  
  if (message.includes('Invalid Refresh Token') || message.includes('Refresh Token Not Found')) {
    return '認証セッションが無効です。再度ログインしてください。'
  } else if (message.includes('Invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません。'
  } else if (message.includes('Email not confirmed')) {
    return 'メールアドレスの確認が完了していません。確認メールをご確認ください。'
  } else if (message.includes('User already registered')) {
    return 'このメールアドレスは既に登録されています。'
  } else if (message.includes('Password should be at least 6 characters')) {
    return 'パスワードは6文字以上で入力してください。'
  } else if (message.includes('Unable to validate email address')) {
    return '有効なメールアドレスを入力してください。'
  } else if (message.includes('Too many requests')) {
    return 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。'
  } else if (message.includes('Network error') || message.includes('Failed to fetch')) {
    return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
  } else if (message.includes('Request timeout')) {
    return 'リクエストがタイムアウトしました。しばらく時間をおいてから再試行してください。'
  }
  
  return message
}

// リフレッシュトークンエラーかどうかを判定する関数
export function isRefreshTokenError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message
  return message.includes('Invalid Refresh Token') || message.includes('Refresh Token Not Found')
}

// 認証エラーかどうかを判定する関数
export function isAuthError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message
  return message.includes('Invalid login credentials') || 
         message.includes('Email not confirmed') ||
         message.includes('User already registered') ||
         message.includes('Password should be at least 6 characters') ||
         message.includes('Unable to validate email address') ||
         message.includes('Too many requests') ||
         isRefreshTokenError(error)
}

// 返金額計算：プラン別の計算ロジック
export function calculateRefund(
  participationFee: number, 
  plan: 'basic' | 'intermediate' | 'advanced',
  recordedDays: number,
  dietSuccessDays: number = 0,
  hasAnyFailure: boolean = false
): number {
  switch (plan) {
    case 'basic':
      // 初級：記録成功日数ベース
      return Math.max(0, Math.floor(participationFee * (recordedDays / 30)))
    
    case 'intermediate':
      // 中級：ダイエット成功日数ベース（全ダイエット法を達成した日数）
      return Math.max(0, Math.floor(participationFee * (dietSuccessDays / 30)))
    
    case 'advanced':
      // 上級：一度でも失敗があれば0円、全て成功なら満額
      if (hasAnyFailure || recordedDays < 30) {
        return 0
      }
      return participationFee
    
    default:
      return 0
  }
}

// 旧バージョンとの互換性のため（初級プランのみ）
export function calculateBasicRefund(participationFee: number, successDays: number): number {
  return calculateRefund(participationFee, 'basic', successDays, 0, false)
}

// 募金額計算：参加費×（記録成功日/30）
export function calculateDonation(participationFee: number, successDays: number): number {
  return participationFee * (successDays / 30)
}

// ダイエット成功日数を計算する関数（中級プラン用）
// 全ダイエット法を達成した日数をカウント
export async function calculateDietSuccessDays(challengeId: string, supabase: SupabaseClient): Promise<number> {
  try {
    // チャレンジに紐づく全ダイエット法の数を取得
    const { data: challengeDietMethods, error: methodsError } = await supabase
      .from('challenge_diet_methods')
      .select('id')
      .eq('challenge_id', challengeId)

    if (methodsError) throw methodsError
    const totalDietMethods = challengeDietMethods?.length || 0

    if (totalDietMethods === 0) return 0

    // 各日の記録を取得し、全ダイエット法を達成した日をカウント
    const { data: dailyRecords, error: recordsError } = await supabase
      .from('daily_records')
      .select(`
        id,
        diet_execution_records (
          challenge_diet_method_id,
          is_successful
        )
      `)
      .eq('challenge_id', challengeId)

    if (recordsError) throw recordsError

    let dietSuccessDays = 0
    
    for (const record of dailyRecords || []) {
      const executionRecords = record.diet_execution_records || []
      
      // その日に記録されたダイエット法の数が全ダイエット法の数と一致し、
      // かつ全て成功している場合のみダイエット成功日とカウント
      if (executionRecords.length === totalDietMethods && 
          executionRecords.every((exec: { is_successful: boolean }) => exec.is_successful === true)) {
        dietSuccessDays++
      }
    }

    return dietSuccessDays
  } catch (error) {
    console.error('Error calculating diet success days:', error)
    return 0
  }
}

// 失敗の有無を判定する関数（上級プラン用）
export async function hasAnyDietFailure(challengeId: string, supabase: SupabaseClient): Promise<boolean> {
  try {
    // 一つでもis_successful=falseの記録があるかチェック
    const { data: failureRecords, error } = await supabase
      .from('diet_execution_records')
      .select('id')
      .eq('daily_record_id', supabase.rpc('get_daily_record_ids_for_challenge', { challenge_id: challengeId }))
      .eq('is_successful', false)
      .limit(1)

    if (error) {
      // rpcが使えない場合は別の方法で取得
      const { data: dailyRecords, error: recordsError } = await supabase
        .from('daily_records')
        .select(`
          id,
          diet_execution_records!inner (
            is_successful
          )
        `)
        .eq('challenge_id', challengeId)
        .eq('diet_execution_records.is_successful', false)
        .limit(1)

      if (recordsError) throw recordsError
      return (dailyRecords?.length || 0) > 0
    }

    return (failureRecords?.length || 0) > 0
  } catch (error) {
    console.error('Error checking diet failures:', error)
    return false
  }
}

// 日付フォーマット関数
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
} 

// ===== JST（日付扱い）ユーティリティ =====
// 'YYYY-MM-DD' の文字列をJST基準で生成
export function getJstYmd(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// 'YYYY-MM-DD' を起点に日数を加算（JST基準）
export function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map((v) => parseInt(v, 10))
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + days)
  return getJstYmd(utc)
}

// 文字列日付（YYYY-MM-DD）同士の比較（JST前提、文字列比較で良い）
export function isAfterYmd(a: string, b: string): boolean {
  return a > b
}

// 'YYYY-MM-DD' を日本語表記に（JSTでのローカライズ表示）
export function formatYmdToJa(ymd: string, withWeekday = false): string {
  const [y, m, d] = ymd.split('-').map((v) => parseInt(v, 10))
  const utc = new Date(Date.UTC(y, m - 1, d))
  return utc.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withWeekday ? { weekday: 'long' as const } : {}),
  })
}

// ===== プラン解放システム =====
// プランの難易度順序
export const PLAN_ORDER: ('basic' | 'intermediate' | 'advanced')[] = ['basic', 'intermediate', 'advanced']

// プラン名の日本語表示
export function getPlanDisplayName(plan: 'basic' | 'intermediate' | 'advanced'): string {
  switch (plan) {
    case 'basic':
      return '初級'
    case 'intermediate':
      return '中級'
    case 'advanced':
      return '上級'
    default:
      return '不明'
  }
}

// ユーザーのプラン解放状況を初期化（新規ユーザー用）
export function getInitialUnlockedPlans(): ('basic' | 'intermediate' | 'advanced')[] {
  return ['basic'] // 初級プランのみデフォルトで解放
}

// 指定したプランが解放されているかをチェック
export function isPlanUnlocked(
  plan: 'basic' | 'intermediate' | 'advanced',
  unlockedPlans: ('basic' | 'intermediate' | 'advanced')[] | null
): boolean {
  if (!unlockedPlans) {
    // データがない場合は初級のみ解放されているとみなす
    return plan === 'basic'
  }
  return unlockedPlans.includes(plan)
}

// 次に解放されるプランを取得
export function getNextPlanToUnlock(
  currentPlan: 'basic' | 'intermediate' | 'advanced'
): 'basic' | 'intermediate' | 'advanced' | null {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan)
  const nextIndex = currentIndex + 1
  
  if (nextIndex >= PLAN_ORDER.length) {
    return null // 最高レベルに達している
  }
  
  return PLAN_ORDER[nextIndex]
}

// プラン解放条件のメッセージを取得
export function getUnlockConditionMessage(plan: 'basic' | 'intermediate' | 'advanced'): string {
  switch (plan) {
    case 'basic':
      return '誰でも挑戦できます'
    case 'intermediate':
      return '初級プランのクリアが必要です'
    case 'advanced':
      return '中級プランのクリアが必要です'
    default:
      return '条件不明'
  }
}

// チャレンジ完了時にプランを解放する
export async function unlockNextPlan(
  userId: string,
  completedPlan: 'basic' | 'intermediate' | 'advanced',
  recordedDaysCount: number,
  supabase: SupabaseClient
): Promise<'basic' | 'intermediate' | 'advanced' | null> {
  try {
    // 30日間の記録が達成されていない場合は解放しない
    if (recordedDaysCount < 30) {
      return null
    }

    // 次のプランを取得
    const nextPlan = getNextPlanToUnlock(completedPlan)
    if (!nextPlan) {
      return null // 最高レベルに達している
    }

    // 現在のプロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('unlocked_plans')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    const currentUnlockedPlans = profile?.unlocked_plans || getInitialUnlockedPlans()
    
    // 既に解放されている場合はスキップ
    if (currentUnlockedPlans.includes(nextPlan)) {
      return null
    }

    // 新しいプランを解放リストに追加
    const updatedUnlockedPlans = [...currentUnlockedPlans, nextPlan]

    // プロフィールを更新
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        unlocked_plans: updatedUnlockedPlans,
        pending_unlock_notification: nextPlan
      })
      .eq('id', userId)

    if (updateError) throw updateError

    return nextPlan
  } catch (error) {
    console.error('Error unlocking next plan:', error)
    return null
  }
}

// 解放通知をクリア
export async function clearUnlockNotification(userId: string, supabase: SupabaseClient): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ pending_unlock_notification: null })
      .eq('id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Error clearing unlock notification:', error)
  }
}

// プラン解放通知メッセージを取得
export function getUnlockNotificationMessage(plan: 'basic' | 'intermediate' | 'advanced'): string {
  const planName = getPlanDisplayName(plan)
  return `🎉 おめでとうございます！${planName}プランが解放されました！`
}