import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約',
  description: 'ダイエット30日チャレンジの利用条件を定めています。',
};

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">利用規約</h1>
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

        {/* 適用 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">2. 適用</h2>
          <p className="text-gray-700">
            本利用規約（以下「本規約」）は、「ダイエット30日チャレンジ」（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。
          </p>
        </section>

        {/* 定義 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">3. 定義</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>「ユーザー」：本サービスを利用するすべての者</li>
            <li>「コンテンツ」：本サービスで提供される文字、画像、プログラム等</li>
            <li>「チャレンジ」：30日間の記録プログラムおよび付随機能一式</li>
          </ul>
        </section>

        {/* アカウントとセキュリティ */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">4. アカウントとセキュリティ</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>ユーザーは、登録情報（メールアドレス、パスワード等）を自己の責任で管理するものとします。</li>
            <li>不正利用が判明した場合は、速やかに連絡先までご連絡ください。</li>
          </ul>
        </section>

        {/* 提供機能 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">5. 提供機能</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>目標設定、ダイエット法の選択/追加、記録時間設定</li>
            <li>体重・実施可否・コメント等の日次記録と達成率算出</li>
            <li>参加費の決済およびチャレンジ完了時の返金算定・処理（Stripe）</li>
            <li>ダッシュボード表示、お問い合わせ機能</li>
          </ul>
        </section>

        {/* 料金・支払い・返金 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">6. 料金・支払い・返金</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>参加費はオンボーディング時に設定され、1円以上の場合にStripeで決済されます。</li>
            <li>返金額は「参加費 × (記録成功日数 / 30)」で算定し、1円以上の場合にStripe経由で返金します。</li>
            <li>チャレンジ途中の任意解約による参加費の返金はありません。</li>
            <li>不具合等、事業者の責に帰すべき事由がある場合は、適切に修補または返金します。</li>
          </ul>
        </section>

        {/* ユーザーの責務 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">7. ユーザーの責務</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>法令・本規約・ガイドに従って本サービスを利用すること</li>
            <li>記録内容は自身の事実に基づき正確に入力すること</li>
            <li>アカウント共有・第三者になりすまし等の不正行為を行わないこと</li>
          </ul>
        </section>

        {/* 禁止事項 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">8. 禁止事項</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>法令・公序良俗に反する行為</li>
            <li>本サービス・第三者の権利を侵害する行為</li>
            <li>システムへの不正アクセス、改ざん、リバースエンジニアリング</li>
            <li>不実の記録や不正な返金獲得を目的とする行為</li>
            <li>本サービスの運営を妨害する行為</li>
          </ul>
        </section>

        {/* 知的財産権 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">9. 知的財産権</h2>
          <p className="text-gray-700">
            本サービスおよび関連するプログラム、画像、文言等に関する知的財産権は事業者または正当な権利者に帰属します。ユーザーは私的利用の範囲でのみ利用できます。
          </p>
        </section>

        {/* 個人情報 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">10. 個人情報の取扱い</h2>
          <p className="text-gray-700">
            事業者は、ユーザーの情報をプライバシーポリシーに従って取り扱います。詳細は「プライバシーポリシー」をご確認ください。
          </p>
        </section>

        {/* サービス変更・停止 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">11. サービスの変更・停止</h2>
          <p className="text-gray-700">
            事業者は、事前告知の上、やむを得ない場合には本サービスの内容変更・一時停止・終了を行うことがあります。
          </p>
        </section>

        {/* 免責事項 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">12. 免責事項</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>事業者は、目的適合性、完全性、正確性、安全性について黙示の保証を行いません。</li>
            <li>健康管理はユーザーの自己責任で行ってください。体調に異変がある場合は医療専門家に相談してください。</li>
            <li>通信障害、外部サービス（Supabase、Stripe）等に起因して生じた損害について、事業者は責任を負いません。ただし、事業者の故意・重過失による場合はこの限りではありません。</li>
          </ul>
        </section>

        {/* 責任の範囲 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">13. 責任の範囲</h2>
          <p className="text-gray-700">
            事業者が責任を負う場合でも、ユーザーが本サービスにおいて現実に支払った直近1ヶ月の参加費相当額を上限とします。ただし、故意・重過失による場合はこの限りではありません。
          </p>
        </section>

        {/* 反社排除 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">14. 反社会的勢力の排除</h2>
          <p className="text-gray-700">
            ユーザーは、反社会的勢力に該当しないこと、また将来にわたって該当しないことを表明・保証します。
          </p>
        </section>

        {/* 未成年 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">15. 未成年者の利用</h2>
          <p className="text-gray-700">
            未成年者は、保護者の同意を得て利用してください。13歳未満の利用制限は設けていません。
          </p>
        </section>

        {/* 準拠法・管轄 */}
        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">16. 準拠法・合意管轄</h2>
          <p className="text-gray-700">
            準拠法は日本法とし、本サービスまたは本規約に関して紛争が生じた場合、事業者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        {/* 連絡方法 */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">17. 連絡方法</h2>
          <p className="text-gray-700">
            本サービスに関する連絡は、アプリ内表示または登録メールアドレス宛の通知、もしくは
            <a href="mailto:yabaichemistryteacher@gmail.com" className="text-purple-600 hover:text-purple-700">yabaichemistryteacher@gmail.com</a>
            への連絡によって行います。
          </p>
        </section>
      </div>
    </div>
  );
}

