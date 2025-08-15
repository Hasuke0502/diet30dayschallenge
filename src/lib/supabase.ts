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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 認証関連のヘルパー関数
export const auth = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({
      email,
      password,
    })
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  getUser: async () => {
    return await supabase.auth.getUser()
  },

  getSession: async () => {
    return await supabase.auth.getSession()
  }
}