import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { user_id, subject, message, email } = await request.json()

    // 基本的なバリデーション
    if (!user_id || !subject || !message || !email) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    // データベースに保存
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        user_id,
        subject,
        message,
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      )
    }

    // メール送信（実際の実装では外部メールサービスを使用）
    // ここでは送信成功として扱う
    console.log('Contact form submission:', {
      from: email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    })

    // 実際のメール送信処理は以下のようになります：
    /*
    const transporter = nodemailer.createTransporter({
      // メール設定
    })

    await transporter.sendMail({
      from: email,
      to: 'yabaichemistryteacher@gmail.com',
      subject: `[ダイエット30日チャレンジ] ${subject}`,
      text: `
        送信者: ${email}
        件名: ${subject}
        
        ${message}
        
        送信日時: ${new Date().toLocaleString('ja-JP')}
      `,
    })
    */

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}