export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: {
          id: string
          email: string
          current_weight?: number | null
          target_weight?: number | null
          snack_frequency_period?: 'day' | 'week' | 'month' | null
          snack_frequency_count?: number | null
          record_time?: string | null
        }
        Update: {
          email?: string
          current_weight?: number | null
          target_weight?: number | null
          snack_frequency_period?: 'day' | 'week' | 'month' | null
          snack_frequency_count?: number | null
          record_time?: string | null
        }
      }
      challenges: {
        Row: {
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
        Insert: {
          user_id: string
          start_date: string
          end_date: string
          participation_fee?: number
          refund_plan?: 'basic' | 'intermediate' | 'advanced'
          initial_weight?: number | null
          current_weight?: number | null
          target_weight?: number | null
          payment_intent_id?: string | null
        }
        Update: {
          recorded_days_count?: number
          achievement_rate?: number
          current_weight?: number | null
          status?: 'active' | 'completed' | 'abandoned'
          refund_amount?: number
          is_refund_processed?: boolean
          payment_intent_id?: string | null
          refund_id?: string | null
        }
      }
      diet_methods: {
        Row: {
          id: string
          name: string
          description: string | null
          question_text: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          name: string
          description?: string | null
          question_text: string
          is_default?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          question_text?: string
        }
      }
      custom_diet_methods: {
        Row: {
          id: string
          user_id: string
          name: string
          question_text: string
          created_at: string
        }
        Insert: {
          user_id: string
          name: string
          question_text: string
        }
        Update: {
          name?: string
          question_text?: string
        }
      }
      challenge_diet_methods: {
        Row: {
          id: string
          challenge_id: string
          diet_method_id: string | null
          custom_diet_method_id: string | null
          created_at: string
        }
        Insert: {
          challenge_id: string
          diet_method_id?: string | null
          custom_diet_method_id?: string | null
        }
        Update: {
          challenge_id?: string
          diet_method_id?: string | null
          custom_diet_method_id?: string | null
        }
      }
      daily_records: {
        Row: {
          id: string
          challenge_id: string
          record_date: string
          created_at: string
          updated_at: string
          weight: number | null
          mood_comment: string | null
          is_completed: boolean
        }
        Insert: {
          challenge_id: string
          record_date: string
          weight?: number | null
          mood_comment?: string | null
          is_completed?: boolean
        }
        Update: {
          weight?: number | null
          mood_comment?: string | null
          is_completed?: boolean
        }
      }
      diet_execution_records: {
        Row: {
          id: string
          daily_record_id: string
          challenge_diet_method_id: string
          is_successful: boolean
          created_at: string
        }
        Insert: {
          daily_record_id: string
          challenge_diet_method_id: string
          is_successful: boolean
        }
        Update: {
          is_successful?: boolean
        }
      }
      contact_messages: {
        Row: {
          id: string
          user_id: string
          subject: string
          message: string
          status: 'pending' | 'resolved'
          created_at: string
        }
        Insert: {
          user_id: string
          subject: string
          message: string
        }
        Update: {
          status?: 'pending' | 'resolved'
        }
      }
    }
  }
}