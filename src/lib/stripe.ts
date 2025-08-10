import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// サーバーサイド用のStripeクライアント
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// クライアントサイド用のStripeクライアント
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
} 