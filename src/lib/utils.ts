import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SupabaseClient } from '@supabase/supabase-js'
import { Profile } from '@/types'

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

/**
 * プラン解放の判定と処理を行う
 * @param currentPlan 現在完了したプラン
 * @param unlockedPlans 既に解放済みのプラン配列
 * @returns 解放されるプランと更新後の解放済みプラン配列
 */
export function determinePlanUnlock(
  currentPlan: 'basic' | 'intermediate' | 'advanced',
  unlockedPlans: ('basic' | 'intermediate' | 'advanced')[] = []
): {
  newlyUnlockedPlan: ('intermediate' | 'advanced') | null;
  updatedUnlockedPlans: ('basic' | 'intermediate' | 'advanced')[];
} {
  // 既に解放済みのプランを確認
  const isBasicUnlocked = unlockedPlans.includes('basic');
  const isIntermediateUnlocked = unlockedPlans.includes('intermediate');
  const isAdvancedUnlocked = unlockedPlans.includes('advanced');

  let newlyUnlockedPlan: ('intermediate' | 'advanced') | null = null;
  const updatedUnlockedPlans = [...unlockedPlans];

  // 初級プラン完了時
  if (currentPlan === 'basic' && !isIntermediateUnlocked) {
    newlyUnlockedPlan = 'intermediate';
    if (!isBasicUnlocked) {
      updatedUnlockedPlans.push('basic');
    }
    updatedUnlockedPlans.push('intermediate');
  }
  // 中級プラン完了時
  else if (currentPlan === 'intermediate' && !isAdvancedUnlocked) {
    newlyUnlockedPlan = 'advanced';
    if (!isBasicUnlocked) {
      updatedUnlockedPlans.push('basic');
    }
    if (!isIntermediateUnlocked) {
      updatedUnlockedPlans.push('intermediate');
    }
    updatedUnlockedPlans.push('advanced');
  }

  return {
    newlyUnlockedPlan,
    updatedUnlockedPlans: [...new Set(updatedUnlockedPlans)] // 重複を除去
  };
}

/**
 * プラン名を日本語で取得
 * @param plan プラン名
 * @returns 日本語のプラン名
 */
export function getPlanDisplayName(plan: 'basic' | 'intermediate' | 'advanced'): string {
  switch (plan) {
    case 'basic':
      return '初級プラン';
    case 'intermediate':
      return '中級プラン';
    case 'advanced':
      return '上級プラン';
    default:
      return '不明なプラン';
  }
}

/**
 * プランの解放条件を取得
 * @param plan プラン名
 * @returns 解放条件の説明
 */
export function getPlanUnlockCondition(plan: 'basic' | 'intermediate' | 'advanced'): string {
  switch (plan) {
    case 'basic':
      return 'すべてのユーザーが選択可能';
    case 'intermediate':
      return '初級プランのクリアが必要です';
    case 'advanced':
      return '中級プランのクリアが必要です';
    default:
      return '不明な条件';
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
  supabase: SupabaseClient
): Promise<'basic' | 'intermediate' | 'advanced' | null> {
  try {

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

/**
 * 上級プランでの失敗時の即座ゲームオーバー処理
 * @param challengeId チャレンジID
 * @param supabase Supabaseクライアント
 * @returns ゲームオーバーが発生したかどうか
 */
export async function checkAdvancedPlanGameOver(
  challengeId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    // 上級プランでの失敗の有無をチェック
    const hasFailure = await hasAnyDietFailure(challengeId, supabase)
    
    if (hasFailure) {
      // 失敗がある場合、チャレンジを完了状態に更新
      const { error } = await supabase
        .from('challenges')
        .update({ 
          status: 'completed',
          refund_amount: 0 // 失敗により返金対象外
        })
        .eq('id', challengeId)
      
      if (error) throw error
      return true // ゲームオーバー
    }
    
    return false // ゲームオーバーではない
  } catch (error) {
    console.error('Error checking advanced plan game over:', error)
    return false
  }
}

/**
 * 上級プランでの未記録時の即座ゲームオーバー処理
 * @param challengeId チャレンジID
 * @param supabase Supabaseクライアント
 * @returns ゲームオーバーが発生したかどうか
 */
export async function checkAdvancedPlanUnrecordedGameOver(
  challengeId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    // チャレンジの開始日を取得
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('start_date')
      .eq('id', challengeId)
      .single()
    
    if (challengeError) throw challengeError
    
    const startDate = challenge.start_date
    const today = getJstYmd()
    
    // 開始日から今日までの日数を計算
    const start = new Date(startDate)
    const end = new Date(today)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    // 今日が開始日から2日目以降の場合、前日の記録をチェック
    if (daysDiff >= 2) {
      const yesterday = addDaysToYmd(today, -1)
      
      // 前日の記録があるかチェック
      const { error: recordError } = await supabase
        .from('daily_records')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('record_date', yesterday)
        .single()
      
      if (recordError && recordError.code === 'PGRST116') {
        // 前日の記録がない場合、ゲームオーバー
        const { error: updateError } = await supabase
          .from('challenges')
          .update({ 
            status: 'completed',
            refund_amount: 0 // 未記録により返金対象外
          })
          .eq('id', challengeId)
        
        if (updateError) throw updateError
        return true // ゲームオーバー
      }
    }
    
    return false // ゲームオーバーではない
  } catch (error) {
    console.error('Error checking advanced plan unrecorded game over:', error)
    return false
  }
}

/**
 * オンボーディング完了状態を判定する
 * @param profile ユーザープロフィール
 * @returns オンボーディングが完了しているかどうか
 */
export function isOnboardingCompleted(profile: Profile | null): boolean {
  if (!profile) {
    console.log('isOnboardingCompleted: プロフィールがありません')
    return false
  }
  
  // 必須項目がすべて設定されているかチェック
  const result = !!(
    profile.current_weight &&
    profile.target_weight &&
    profile.snack_frequency_period &&
    profile.snack_frequency_count &&
    profile.record_time
  )
  
  console.log('isOnboardingCompleted:', {
    result,
    current_weight: profile.current_weight,
    target_weight: profile.target_weight,
    snack_frequency_period: profile.snack_frequency_period,
    snack_frequency_count: profile.snack_frequency_count,
    record_time: profile.record_time
  })
  
  return result
}



// 自動ログインの状態を確認
export const checkAutoLoginStatus = () => {
  if (typeof window === 'undefined') return false
  
  const token = localStorage.getItem('diet-app-auth-token')
  if (!token) return false
  
  try {
    const parsed = JSON.parse(token)
    const expiresAt = parsed.expires_at * 1000 // 秒からミリ秒に変換
    const now = Date.now()
    
    // 有効期限が切れていないかチェック
    if (expiresAt > now) {
      return true
    } else {
      // 期限切れのトークンを削除
      localStorage.removeItem('diet-app-auth-token')
      return false
    }
  } catch {
    // 不正なトークンの場合は削除
    localStorage.removeItem('diet-app-auth-token')
    return false
  }
}

// セッションの残り時間を取得（分単位）
export const getSessionTimeRemaining = () => {
  if (typeof window === 'undefined') return 0
  
  const token = localStorage.getItem('diet-app-auth-token')
  if (!token) return 0
  
  try {
    const parsed = JSON.parse(token)
    const expiresAt = parsed.expires_at * 1000
    const now = Date.now()
    const remaining = expiresAt - now
    
    if (remaining > 0) {
      return Math.floor(remaining / (1000 * 60)) // 分単位で返す
    }
    return 0
  } catch {
    return 0
  }
}

// ===== ダイエット法設定管理 =====

/**
 * 現在のアクティブチャレンジから選択されているダイエット法を取得
 * @param userId ユーザーID
 * @param supabase Supabaseクライアント
 * @returns 選択されているダイエット法の情報
 */
export async function getCurrentDietMethods(userId: string, supabase: SupabaseClient) {
  try {
    // アクティブなチャレンジを取得
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (challengeError || !challenge) {
      return {
        defaultMethods: [],
        customMethods: []
      }
    }

    // チャレンジに紐づくダイエット法を取得
    const { data: challengeDietMethods, error: methodsError } = await supabase
      .from('challenge_diet_methods')
      .select(`
        id,
        diet_methods (
          id,
          name,
          description,
          question_text
        ),
        custom_diet_methods (
          id,
          name,
          question_text
        )
      `)
      .eq('challenge_id', challenge.id)

    if (methodsError) throw methodsError

    const defaultMethods = challengeDietMethods
      ?.filter(item => item.diet_methods)
      .map(item => item.diet_methods)
      .filter(Boolean) || []

    const customMethods = challengeDietMethods
      ?.filter(item => item.custom_diet_methods)
      .map(item => item.custom_diet_methods)
      .filter(Boolean) || []

    return {
      defaultMethods,
      customMethods
    }
  } catch (error) {
    console.error('Error getting current diet methods:', error)
    return {
      defaultMethods: [],
      customMethods: []
    }
  }
}

/**
 * ユーザーの好みのダイエット法設定を保存
 * @param userId ユーザーID
 * @param selectedDefaultMethods 選択されたデフォルトダイエット法のIDリスト
 * @param selectedCustomMethods 選択されたカスタムダイエット法の名前リスト
 * @param supabase Supabaseクライアント
 */
export async function savePreferredDietMethods(
  userId: string,
  selectedDefaultMethods: string[],
  selectedCustomMethods: string[],
  supabase: SupabaseClient
): Promise<void> {
  try {
    console.log('Saving preferred diet methods:', {
      userId,
      selectedDefaultMethods,
      selectedCustomMethods
    })

    const { error } = await supabase
      .from('profiles')
      .update({
        preferred_diet_methods: selectedDefaultMethods,
        preferred_custom_diet_methods: selectedCustomMethods
      })
      .eq('id', userId)

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log('Successfully saved preferred diet methods')
  } catch (error) {
    console.error('Error saving preferred diet methods:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

/**
 * ユーザーの好みのダイエット法設定を取得
 * @param userId ユーザーID
 * @param supabase Supabaseクライアント
 * @returns 保存されているダイエット法の設定
 */
export async function getPreferredDietMethods(
  userId: string,
  supabase: SupabaseClient
): Promise<{
  defaultMethods: string[]
  customMethods: string[]
}> {
  try {
    console.log('🔍 getPreferredDietMethods開始:', { userId })
    
    if (!userId) {
      console.error('❌ userIdが無効です')
      return {
        defaultMethods: [],
        customMethods: []
      }
    }

    console.log('🔍 Supabaseクエリ実行前:', {
      table: 'profiles',
      select: 'preferred_diet_methods, preferred_custom_diet_methods',
      userId
    })

    // まず基本的なプロフィール情報を取得してスキーマを確認
    try {
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      console.log('🔍 基本プロフィール確認:', {
        hasBasicProfile: !!basicProfile,
        basicError,
        profileKeys: basicProfile ? Object.keys(basicProfile) : null,
        hasPreferredDietMethods: basicProfile ? 'preferred_diet_methods' in basicProfile : false,
        hasPreferredCustomDietMethods: basicProfile ? 'preferred_custom_diet_methods' in basicProfile : false
      })
    } catch (schemaError) {
      console.error('❌ スキーマ確認エラー:', schemaError)
    }

    // フォールバック方式：まず基本カラムで試してから、preferred_カラムを試す
    let profile = null
    let error: unknown = null

    try {
      // まず基本カラムのみで確認
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .maybeSingle()

      if (basicError) {
        console.error('❌ 基本プロフィール取得エラー:', basicError)
        error = basicError
      } else if (basicProfile) {
        console.log('✅ 基本プロフィール確認成功')
        
        // 基本プロフィールが存在する場合、preferred_カラムを試す
        const { data: preferredProfile, error: preferredError } = await supabase
          .from('profiles')
          .select('preferred_diet_methods, preferred_custom_diet_methods')
          .eq('id', userId)
          .maybeSingle()

        if (preferredError) {
          console.warn('⚠️ preferred_カラム取得エラー (カラムが存在しない可能性):', preferredError)
          // カラムが存在しない場合はデフォルト値を返す
          profile = { preferred_diet_methods: null, preferred_custom_diet_methods: null }
        } else {
          profile = preferredProfile
        }
      } else {
        console.log('ℹ️ プロフィール自体が存在しません')
      }
    } catch (queryError) {
      console.error('❌ クエリ実行エラー:', queryError)
      error = queryError
    }

    console.log('🔍 Supabaseクエリ実行後:', {
      hasData: !!profile,
      hasError: !!error,
      profile,
      error
    })

    if (error) {
      const errorObj = error as Record<string, unknown>
      console.error('❌ Supabaseクエリエラー - 詳細調査:', {
        error,
        errorType: typeof error,
        errorConstructor: typeof errorObj.constructor === 'function' ? errorObj.constructor.name : undefined,
        errorKeys: typeof error === 'object' && error !== null ? Object.keys(error) : [],
        message: typeof errorObj.message === 'string' ? errorObj.message : undefined,
        code: typeof errorObj.code === 'string' ? errorObj.code : undefined,
        details: errorObj.details,
        hint: typeof errorObj.hint === 'string' ? errorObj.hint : undefined,
        // エラーオブジェクト全体をJSON化
        fullError: JSON.stringify(error, null, 2)
      })
      
      throw error
    }

    // maybeSingle()でprofileがnullの場合（プロフィールが存在しない）
    if (!profile) {
      console.log('ℹ️ プロフィールが見つかりません（初回ユーザーまたは該当カラムが未設定）')
      return {
        defaultMethods: [],
        customMethods: []
      }
    }

    console.log('✅ プロフィール取得成功:', {
      preferred_diet_methods: profile?.preferred_diet_methods,
      preferred_custom_diet_methods: profile?.preferred_custom_diet_methods
    })

    return {
      defaultMethods: profile?.preferred_diet_methods || [],
      customMethods: profile?.preferred_custom_diet_methods || []
    }
  } catch (error) {
    console.error('❌ getPreferredDietMethods エラー:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      userId
    })
    return {
      defaultMethods: [],
      customMethods: []
    }
  }
}