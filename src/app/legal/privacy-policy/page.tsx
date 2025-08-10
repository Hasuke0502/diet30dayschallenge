import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'ダイエット30日チャレンジにおける個人情報等の取扱いについて定めています。',
};

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
          <p className="text-sm text-gray-500">最終更新日：2025年8月9日</p>
        </header>

        {/* 事業者情報 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">1. 事業者情報</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>事業者名：大久保葉介（個人）</li>
            <li>
              連絡先：
              <a
                href="mailto:yabaichemistryteacher@gmail.com"
                className="text-purple-600 hover:text-purple-700"
              >
                yabaichemistryteacher@gmail.com
              </a>
            </li>
            <li>住所・電話番号：請求があった場合に遅滞なく開示</li>
          </ul>
        </section>

        {/* 取得する情報 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">2. 取得する情報</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>アカウント情報（メールアドレス、パスワードは認証基盤により安全に管理）</li>
            <li>プロフィール/オンボーディング情報（現在体重・目標体重、記録時間、スナック摂取頻度、選択/追加ダイエット法名）</li>
            <li>チャレンジ情報（参加費、開始/終了日、体重情報、記録日数・達成率・返金額、ステータス、決済関連ID、返金処理フラグ 等）</li>
            <li>日次記録（体重、各ダイエット法の実施可否、気分・コメント、対策メモ）</li>
            <li>お問い合わせ情報（件名、内容、ユーザーID、連絡用メールアドレス）</li>
            <li>技術情報（セッション管理のためのCookie/ローカルストレージ、不正防止のためのアクセスログ等）</li>
          </ul>
        </section>

        {/* 利用目的 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">3. 利用目的</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>本人認証、セッション管理、不正防止</li>
            <li>本サービスの提供・運用（進捗可視化、記録、返金計算等）</li>
            <li>参加費の決済および返金処理</li>
            <li>お問い合わせ対応、重要なお知らせの配信</li>
            <li>品質向上のための統計的分析（個人を特定しない形）</li>
          </ul>
        </section>

        {/* 決済情報 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">4. 決済情報の取扱い（Stripe）</h2>
          <p className="text-gray-700">
            クレジットカード番号等の機微な情報はStripe社で処理され、当方では保持しません。当方は決済・返金管理に必要な最小限の情報（payment_intent_id、refund_id、金額等）のみを保持します。
          </p>
        </section>

        {/* Cookie等 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">5. Cookie等の利用</h2>
          <p className="text-gray-700">
            認証・セッション管理のためCookieまたはローカルストレージを使用します。広告目的のトラッキングは行いません。現時点で解析ツールは利用していません（導入時は本ポリシーを更新します）。
          </p>
        </section>

        {/* 第三者提供・委託 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">6. 第三者提供・委託</h2>
          <p className="text-gray-700">
            Supabase、Stripe、メール送信サービス等に対し、目的達成に必要な範囲で取扱いを委託します。法令に基づく場合を除き、本人の同意なく第三者に提供しません。委託先には適切な監督を行います。
          </p>
        </section>

        {/* 国外移転 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">7. 国外へのデータ移転</h2>
          <p className="text-gray-700">外部サービスのサーバーが日本国外にある場合、当該国でデータが保存・処理されます。</p>
        </section>

        {/* 安全管理 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">8. 安全管理措置</h2>
          <p className="text-gray-700">
            通信の暗号化（TLS）、アクセス制御・最小権限、環境変数による鍵管理、行レベルセキュリティ（RLS）等の活用、ログ監査、脆弱性対策等の措置を講じます。
          </p>
        </section>

        {/* 保有期間 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">9. 保有期間</h2>
          <p className="text-gray-700">
            アカウントが有効な期間中および本サービス提供に必要な期間、または法令上必要な保存期間保持し、不要となった情報は適切に削除・匿名化します。
          </p>
        </section>

        {/* 権利行使 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">10. ユーザーの権利</h2>
          <p className="text-gray-700">
            開示、訂正・追加・削除、利用停止・第三者提供停止のご請求に対応します。本人確認の上で実施します。連絡先：
            <a href="mailto:yabaichemistryteacher@gmail.com" className="text-purple-600 hover:text-purple-700">yabaichemistryteacher@gmail.com</a>
          </p>
        </section>

        {/* 退会・削除 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">11. 退会・削除</h2>
          <p className="text-gray-700">退会やデータ削除のご希望は、上記連絡先までご依頼ください（アプリ内機能提供時に案内します）。</p>
        </section>

        {/* 未成年 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">12. 未成年者の個人情報</h2>
          <p className="text-gray-700">未成年者は、保護者の同意を得た上でご利用ください。13歳未満の利用制限は設けていません。</p>
        </section>

        {/* 健康情報 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">13. 健康関連情報の取扱い</h2>
          <p className="text-gray-700">体重や生活習慣等の健康に関する情報は特に配慮して厳重に管理し、本人の同意なく目的外利用や第三者提供は行いません。</p>
        </section>

        {/* 変更 */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">14. 変更</h2>
          <p className="text-gray-700">本ポリシーを変更する場合、アプリ内で周知し、重要な変更は合理的な方法で通知します。</p>
        </section>
      </div>
    </div>
  );
}

