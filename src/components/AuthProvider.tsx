'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { isRefreshTokenError } from '@/lib/utils'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)
  const isTransitioningRef = useRef(false)
  const previousUserRef = useRef<string | null>(null)
  
  // Supabaseクライアントを作成
  const supabase = createClient()

  const fetchProfile = async (userId: string, force = false) => {
    // 既に同じユーザーのプロフィールを取得済みの場合は再取得をスキップ
    if (!force && lastFetchedUserIdRef.current === userId && profile) {
      console.log('プロフィール取得をスキップ（既に取得済み）:', userId)
      return profile
    }

    try {
      console.log('プロフィール取得開始:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return null
      }
      lastFetchedUserIdRef.current = userId
      console.log('プロフィール取得完了:', userId)
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, true) // 強制取得
      setProfile(profileData)
    }
  }

  // セッションをクリアして再認証を促す
  const clearSessionAndRedirect = async () => {
    try {
      console.log('セッションをクリアして再認証を促します')
      const supabaseClient = createClient()
      await supabaseClient.auth.signOut()
      setUser(null)
      setProfile(null)
      lastFetchedUserIdRef.current = null
      previousUserRef.current = null
      
      // ログインページにリダイレクト
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin'
      }
    } catch (error) {
      console.error('セッションクリアエラー:', error)
    }
  }

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        console.log('セッション情報を復元中...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // リフレッシュトークンエラーが発生した場合
        if (error) {
          console.error('初期セッション取得エラー:', error)
          if (isRefreshTokenError(error.message)) {
            await clearSessionAndRedirect()
            return
          }
        }
        
        const currentUserId = session?.user?.id || null
        
        // ユーザーIDが変更された場合のみ状態を更新
        if (previousUserRef.current !== currentUserId) {
          setUser(session?.user ?? null)
          previousUserRef.current = currentUserId
          
          if (session?.user) {
            console.log('セッション復元成功:', session.user.email)
            const profileData = await fetchProfile(session.user.id)
            console.log('プロフィール取得完了:', profileData ? 'あり' : 'なし')
            setProfile(profileData)
          } else {
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('初期セッション取得エラー:', error)
        // リフレッシュトークン関連のエラーの場合
        if (error instanceof Error && isRefreshTokenError(error.message)) {
          await clearSessionAndRedirect()
          return
        }
      } finally {
        setLoading(false)
        setIsInitializing(false)
      }
    }

    getInitialSession()

    // セッションの自動更新（1時間ごと）
    const sessionRefreshInterval = setInterval(async () => {
      if (user) {
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('セッション自動更新エラー:', error)
            if (isRefreshTokenError(error.message)) {
              await clearSessionAndRedirect()
            }
          } else if (data.session) {
            console.log('セッション自動更新成功')
          }
        } catch (error) {
          console.error('セッション自動更新エラー:', error)
        }
      }
    }, 60 * 60 * 1000) // 1時間ごと

    // 認証状態変更のリスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 遷移中は状態更新をスキップ
        if (isTransitioningRef.current) {
          return
        }

        const currentUserId = session?.user?.id || null
        
        // ユーザーIDが変更された場合のみ状態を更新
        if (previousUserRef.current !== currentUserId) {
          console.log('認証状態変更:', event, currentUserId)
          
          setUser(session?.user ?? null)
          previousUserRef.current = currentUserId

          if (session?.user) {
            // 同一ユーザーで既に取得済みの場合の無駄な再フェッチを避ける
            if (lastFetchedUserIdRef.current !== session.user.id || !profile) {
              const profileData = await fetchProfile(session.user.id, false)
              setProfile(profileData)
            }
          } else {
            setProfile(null)
            lastFetchedUserIdRef.current = null
          }
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      clearInterval(sessionRefreshInterval)
    }
  }, []) // 依存配列を空にして無限ループを防ぐ

  const signOut = async () => {
    isTransitioningRef.current = true
    setIsTransitioning(true)
    try {
      const supabaseClient = createClient()
      await supabaseClient.auth.signOut()
    } catch (error) {
      console.error('サインアウトエラー:', error)
      // エラーが発生しても状態をリセット
      setUser(null)
      setProfile(null)
      lastFetchedUserIdRef.current = null
      previousUserRef.current = null
    } finally {
      // サインアウト後、少し遅延を入れてから状態をリセット
      setTimeout(() => {
        isTransitioningRef.current = false
        setIsTransitioning(false)
      }, 200)
    }
  }

  const value = {
    user,
    profile,
    loading: loading || isInitializing || isTransitioning,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}