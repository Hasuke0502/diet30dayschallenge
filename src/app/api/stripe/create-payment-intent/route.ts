import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { amount, metadata } = await request.json()

    if (!amount || amount < 0) {
      return NextResponse.json(
        { error: '無効な金額です' },
        { status: 400 }
      )
    }

    // Payment Intentを作成
    // 開発中はウォレット類の警告回避のため、カードのみに限定
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // 円単位
      currency: 'jpy',
      metadata: metadata || {},
      payment_method_types: ['card'],
      // 自動決済手段の列挙は無効化（本番で有効化したい場合はダッシュボード設定とHTTPS/ドメイン検証を完了させてから）
      // automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: '決済の準備に失敗しました' },
      { status: 500 }
    )
  }
}