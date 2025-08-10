import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { challengeId } = await request.json()

    if (!challengeId) {
      return NextResponse.json(
        { error: 'チャレンジIDが必要です' },
        { status: 400 }
      )
    }

    // チャレンジ情報を取得
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'チャレンジが見つかりません' },
        { status: 404 }
      )
    }

    // 既に返金処理済みかチェック
    if (challenge.is_refund_processed) {
      return NextResponse.json(
        { error: '既に返金処理済みです' },
        { status: 400 }
      )
    }

    // 返金額が0円の場合は処理をスキップ
    if (challenge.refund_amount <= 0) {
      // 返金処理済みフラグを更新
      await supabaseAdmin
        .from('challenges')
        .update({ is_refund_processed: true })
        .eq('id', challengeId)

      return NextResponse.json({ success: true, refunded: false })
    }

    if (!challenge.payment_intent_id) {
      return NextResponse.json(
        { error: '決済情報が見つかりません（payment_intent_id未保存）' },
        { status: 409 }
      )
    }

    // 実際の返金処理
    const refund = await stripe.refunds.create({
      payment_intent: challenge.payment_intent_id,
      amount: challenge.refund_amount,
      metadata: {
        challenge_id: challengeId,
        user_id: challenge.user_id,
      },
    })

    // 返金処理済みフラグを更新
    await supabaseAdmin
      .from('challenges')
      .update({ 
        is_refund_processed: true,
        refund_id: refund.id,
      })
      .eq('id', challengeId)

    return NextResponse.json({ 
      success: true, 
      refunded: true,
      amount: challenge.refund_amount,
      refundId: refund.id,
    })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: '返金処理に失敗しました' },
      { status: 500 }
    )
  }
}