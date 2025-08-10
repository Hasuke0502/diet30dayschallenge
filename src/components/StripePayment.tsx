'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Lock } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  onSuccess: (paymentIntentId?: string) => void
  onError: (error: string) => void
}

function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        onError(error.message || '決済に失敗しました')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      } else if (paymentIntent?.status === 'requires_action') {
        onError('追加認証が必要です。画面の指示に従ってください。')
      } else if (paymentIntent?.status === 'processing') {
        onError('決済処理中です。数秒後に再度お試しください。')
      } else {
        onError('支払いが完了しませんでした。もう一度お試しください。')
      }
    } catch (e: unknown) {
      console.error('Stripe confirmPayment error:', e)
      onError('決済処理中にエラーが発生しました')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">参加費</span>
          <span className="text-2xl font-bold text-gray-900">
            ¥{amount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>SSL暗号化により安全に処理されます</span>
        </div>
        
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {processing ? '処理中...' : `¥${amount.toLocaleString()}を支払う`}
      </button>
    </form>
  )
}

interface StripePaymentProps {
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

export default function StripePayment({ amount, onSuccess, onError }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const initializePayment = async () => {
    if (amount <= 0) {
      onSuccess() // 0円の場合は即座に成功とする
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          metadata: {
            type: 'diet_challenge_participation',
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '決済の準備に失敗しました')
      }

      setClientSecret(data.clientSecret)
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : '決済の準備に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (amount <= 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 font-medium mb-2">
          参加費0円
        </div>
        <p className="text-green-700 text-sm mb-4">
          無料でチャレンジに参加できます！
        </p>
        <button
          onClick={onSuccess}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          チャレンジを開始
        </button>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="text-center">
        <div className="flex items-center space-x-3 mb-4">
          <CreditCard className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">決済情報</h3>
        </div>
        <p className="text-gray-600 mb-6">
          チャレンジ参加費をお支払いください
        </p>
        <button
          onClick={initializePayment}
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '準備中...' : '決済手続きを開始'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <CreditCard className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-medium text-gray-900">決済情報</h3>
      </div>
      
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#9333ea',
            },
          },
        }}
      >
        <PaymentForm 
          amount={amount} 
          onSuccess={onSuccess} 
          onError={onError} 
        />
      </Elements>
    </div>
  )
}