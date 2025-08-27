import { createClient } from '@/lib/supabase/client'

export const auth = {
  signUp: async (email: string, password: string) => {
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
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
    const supabase = createClient()
    try {
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('サインアウトエラー:', error)
      throw error
    }
  },

  getUser: async () => {
    const supabase = createClient()
    try {
      return await supabase.auth.getUser()
    } catch (error) {
      console.error('ユーザー取得エラー:', error)
      throw error
    }
  },

  getSession: async () => {
    const supabase = createClient()
    try {
      return await supabase.auth.getSession()
    } catch (error) {
      console.error('セッション取得エラー:', error)
      throw error
    }
  },

  // リフレッシュトークンの状態を確認
  checkSession: async () => {
    const supabase = createClient()
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
