'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
// import { supabase } from '@/lib/supabase'
import { ArrowLeft, User, Mail, Send } from 'lucide-react'
import Link from 'next/link'
import { useSound } from '@/hooks/useSound'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { playClickSound, isSoundEnabled, toggleSound } = useSound()
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          subject: contactForm.subject,
          message: contactForm.message,
        }),
      })

      if (!response.ok) {
        throw new Error('送信に失敗しました')
      }

      setSubmitted(true)
      setContactForm({ subject: '', message: '' })
    } catch (error) {
      console.error('Error submitting contact form:', error)
      alert('送信に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">設定</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* プロフィール情報 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">プロフィール情報</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                </div>
                {profile && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        現在の体重
                      </label>
                      <span className="text-gray-900">{profile.current_weight}kg</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        目標体重
                      </label>
                      <span className="text-gray-900">{profile.target_weight}kg</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 音声設定 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">音声設定</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700">クリック音</p>
                  <p className="text-sm text-gray-500">ボタンを押した時の音声効果</p>
                </div>
                <button
                  onClick={() => {
                    playClickSound();
                    toggleSound();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isSoundEnabled ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* お問い合わせフォーム */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Send className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-900">お問い合わせ</h2>
              </div>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-green-600 font-medium mb-2">
                    お問い合わせを受け付けました
                  </div>
                  <p className="text-green-700 text-sm">
                    ご連絡いただきありがとうございます。お返事までしばらくお待ちください。
                  </p>
                  <button
                    onClick={() => {
                      playClickSound();
                      setSubmitted(false);
                    }}
                    className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    新しいお問い合わせを送信
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      件名
                    </label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">件名を選択してください</option>
                      <option value="使い方について">使い方について</option>
                      <option value="技術的な問題">技術的な問題</option>
                      <option value="決済・返金について">決済・返金について</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お問い合わせ内容
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={6}
                      placeholder="お問い合わせ内容を詳しくご記入ください..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    onClick={() => playClickSound()}
                    disabled={submitting || !contactForm.subject || !contactForm.message}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? '送信中...' : '送信する'}
                  </button>
                </form>
              )}
            </div>

            {/* 法的情報 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">法的情報</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <Link href="/legal/commercial-transactions" className="text-purple-600 hover:text-purple-700">
                    特定商取引法に基づく表記
                  </Link>
                </div>
                <div>
                  <Link href="/legal/privacy-policy" className="text-purple-600 hover:text-purple-700">
                    プライバシーポリシー
                  </Link>
                </div>
                <div>
                  <Link href="/legal/terms" className="text-purple-600 hover:text-purple-700">
                    利用規約
                  </Link>
                </div>
              </div>
            </div>

            {/* アプリ情報 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                ダイエット30日チャレンジ
              </h2>
              <p className="text-gray-600 text-sm">
                Version 1.0.0
              </p>
              <p className="text-gray-500 text-xs mt-2">
                © 2024 ダイエット30日チャレンジ. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}