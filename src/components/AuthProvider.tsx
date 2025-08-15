'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'

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

  const fetchProfile = async (userId: string) => {
    try {
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
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUserId = session?.user?.id || null
        
        // ユーザーIDが変更された場合のみ状態を更新
        if (previousUserRef.current !== currentUserId) {
          setUser(session?.user ?? null)
          previousUserRef.current = currentUserId
          
          if (session?.user) {
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          } else {
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('初期セッション取得エラー:', error)
      } finally {
        setLoading(false)
        setIsInitializing(false)
      }
    }

    getInitialSession()

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
              const profileData = await fetchProfile(session.user.id)
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

    return () => subscription.unsubscribe()
  }, [profile])

  const signOut = async () => {
    isTransitioningRef.current = true
    setIsTransitioning(true)
    try {
      await supabase.auth.signOut()
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