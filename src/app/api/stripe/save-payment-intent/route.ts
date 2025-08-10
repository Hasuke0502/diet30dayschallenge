import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id } = await request.json()

    if (!payment_intent_id) {
      return NextResponse.json({ error: 'payment_intent_idが必要です' }, { status: 400 })
    }

    // 直近のアクティブチャレンジに保存（ユーザー特定はRLS前提だが、service roleを使うため安全策として最新activeを1件）
    const { data: activeChallenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (challengeError || !activeChallenge) {
      return NextResponse.json({ error: 'アクティブなチャレンジが見つかりません' }, { status: 404 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('challenges')
      .update({ payment_intent_id })
      .eq('id', activeChallenge.id)

    if (updateError) {
      return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('save-payment-intent error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}


