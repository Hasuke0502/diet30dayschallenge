export type { Database } from './database'

// 追加の型定義
export interface Challenge {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  start_date: string
  end_date: string
  participation_fee: number
  refund_plan: 'basic' | 'intermediate' | 'advanced'
  status: 'active' | 'completed' | 'abandoned'
  recorded_days_count: number
  achievement_rate: number
  initial_weight: number | null
  current_weight: number | null
  target_weight: number | null
  refund_amount: number
  is_refund_processed: boolean
  payment_intent_id: string | null
  refund_id: string | null
}

export interface DietMethod {
  id: string
  name: string
  description: string | null
  question_text: string
  is_default: boolean
  created_at: string
}

export interface CustomDietMethod {
  id: string
  user_id: string
  name: string
  question_text: string
  created_at: string
}

export interface DailyRecord {
  id: string
  challenge_id: string
  record_date: string
  created_at: string
  updated_at: string
  weight: number | null
  mood_comment: string | null
  is_completed: boolean
  diet_execution_records?: DietExecutionRecord[]
}

export interface DietExecutionRecord {
  id: string
  daily_record_id: string
  challenge_diet_method_id: string
  is_successful: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  created_at: string
  updated_at: string
  current_weight: number | null
  target_weight: number | null
  snack_frequency_period: 'day' | 'week' | 'month' | null
  snack_frequency_count: number | null
  record_time: string | null
}

// フォーム用の型
export interface OnboardingFormData {
  currentWeight: number
  targetWeight: number
  selectedDietMethods: string[]
  customDietMethods: string[]
  snackPeriod: 'day' | 'week' | 'month'
  snackCount: number
  participationFee: number
  recordTime: string
}

export interface DailyRecordFormData {
  weight: number
  dietResults: Record<string, boolean>
  moodComment: string
}

// ナラティブ要素用の型
export interface MoneyMonsterData {
  maxHealth: number
  currentHealth: number
  recoveredAmount: number
  remainingAmount: number
  achievementRate: number
}

// チャレンジカレンダー用の型
export interface CalendarDay {
  date: string
  status: 'recorded' | 'unrecorded' | 'future'
  isSuccess?: boolean
}