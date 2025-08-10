import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記',
  description:
    '本サービス（ダイエット30日チャレンジ機能の提供）に関する特定商取引法に基づく表記を掲載しています。',
};

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            特定商取引法に基づく表記
          </h1>
          <p className="text-sm text-gray-500">最終更新日：2025年8月9日</p>
        </header>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">1. 販売事業者</h2>
          <p className="text-gray-700">大久保葉介（個人）</p>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">2. 運営統括責任者</h2>
          <p className="text-gray-700">大久保葉介</p>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">3. 所在地</h2>
          <p className="text-gray-700">※請求があったら遅滞なく開示します</p>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">4. 連絡先</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              メールアドレス：
              <a
                href="mailto:yabaichemistryteacher@gmail.com"
                className="text-purple-600 hover:text-purple-700"
              >
                yabaichemistryteacher@gmail.com
              </a>
            </li>
            <li>電話番号：※請求があったら遅滞なく開示します</li>
            <li>営業時間：平日10:00〜18:00（土日祝日・年末年始を除く）</li>
          </ul>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">5. 販売価格</h2>
          <p className="text-gray-700">
            オンボーディング時に表示される参加費に準じます ※表示価格は全て税込みです
          </p>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">6. 商品代金以外の必要料金</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>決済手数料：無料</li>
            <li>返金手数料：無料</li>
          </ul>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">7. 支払方法</h2>
          <p className="text-gray-700">
            クレジットカード決済（Stripe） 対応カード：Visa, Mastercard, American Express, JCB
          </p>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">8. 支払時期</h2>
          <p className="text-gray-700">クレジットカード決済の場合、オンボーディング時の参加費設定時に即時決済されます</p>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">9. 商品の引渡時期</h2>
          <p className="text-gray-700">参加費決済完了後、即時にダイエット30日チャレンジ機能の利用を開始いただけます。</p>
        </section>

        <section className="space-y-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">10. 返品・キャンセルについて</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>
              <span className="font-semibold">お客様都合による返金の場合</span>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>チャレンジの途中放棄は可能ですが、参加費の返金はありません。</li>
                <li>
                  チャレンジ完了後（30日経過後、または30日分の記録が全て埋まった時点）の返金については、
                  記録成功日数に応じて返金計算式に基づき算定された金額が返金されます。
                </li>
              </ul>
            </li>
            <li>
              <span className="font-semibold">サービスに不具合があった場合</span>
              ：当社の責任において速やかに不具合を修正、もしくは全額返金いたします。
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">11. 特記事項</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>本サービスはデジタルコンテンツ（ダイエット30日チャレンジ機能の提供）です。</li>
            <li>サービスの性質上、提供開始後の参加費の途中返金は承っておりません。</li>
            <li>チャレンジ完了後の返金は、記録成功日数に基づく計算式に則って行われます。</li>
            <li>詳細はオンボーディング画面およびアプリ内の説明をご確認ください。</li>
          </ul>
        </section>
      </div>
    </div>
  );
}


