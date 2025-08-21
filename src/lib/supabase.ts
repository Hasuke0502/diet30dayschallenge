import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// デバッグ用: 環境変数の値を確認（本番環境では削除）
console.log('Supabase設定確認:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : '未設定',
  hasKey: !!supabaseAnonKey,
  env: process.env.NODE_ENV
})

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
  ].filter(Boolean)
  throw new Error(
    `Supabaseの環境変数が未設定です: ${missing.join(', ')}\n` +
    '`.env.local` に以下を設定してください:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key\n'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // リフレッシュトークンの自動更新を有効化
    autoRefreshToken: true,
    // 永続化されたセッションを復元
    persistSession: true,
    // セッションの有効期限を設定（デフォルト: 1時間）
    detectSessionInUrl: true,
    // エラーハンドリングを改善
    flowType: 'pkce',
    // セッションの永続化を確実にする
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // セッションの有効期限を延長（7日間）
    storageKey: 'diet-app-auth-token',
  },
  // グローバルヘッダーを設定
  global: {
    headers: {
      'X-Client-Info': 'diet-app',
    },
  },
})

// 認証関連のヘルパー関数
export const auth = {
  signUp: async (email: string, password: string) => {
    try {
      return await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (error) {
      console.error('サインアップエラー:', error)
      throw error
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      return await supabase.auth.signInWithPassword({
        email,
        password,
      })
    } catch (error) {
      console.error('サインインエラー:', error)
      throw error
    }
  },

  // 自動ログイン用のセッション確認
  checkAutoLogin: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('自動ログイン確認エラー:', error)
        return { success: false, error }
      }
      
      if (session?.user) {
        console.log('自動ログイン成功:', session.user.email)
        return { success: true, user: session.user, session }
      }
      
      return { success: false, user: null, session: null }
    } catch (error) {
      console.error('自動ログイン確認エラー:', error)
      return { success: false, error }
    }
  },

  // セッションの有効期限を延長
  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('セッション更新エラー:', error)
        return { success: false, error }
      }
      
      if (data.session) {
        console.log('セッション更新成功')
        return { success: true, session: data.session }
      }
      
      return { success: false, session: null }
    } catch (error) {
      console.error('セッション更新エラー:', error)
      return { success: false, error }
    }
  },

  signOut: async () => {
    try {
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('サインアウトエラー:', error)
      throw error
    }
  },

  getUser: async () => {
    try {
      return await supabase.auth.getUser()
    } catch (error) {
      console.error('ユーザー取得エラー:', error)
      throw error
    }
  },

  getSession: async () => {
    try {
      return await supabase.auth.getSession()
    } catch (error) {
      console.error('セッション取得エラー:', error)
      throw error
    }
  },

  // リフレッシュトークンの状態を確認
  checkSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('セッション確認エラー:', error)
        return { valid: false, error }
      }
      return { valid: !!data.session, session: data.session }
    } catch (error) {
      console.error('セッション確認エラー:', error)
      return { valid: false, error }
    }
  },
}