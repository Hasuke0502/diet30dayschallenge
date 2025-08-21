# ダイエット30日チャレンジ

マネーモンスターを倒してお金と健康を取り戻すダイエットチャレンジアプリです。

## 機能概要

### コアコンセプト
お菓子の甘い誘惑から生まれた悪しき存在「マネーモンスター」があなたのお金を奪っている！毎日の記録でマネーモンスターにダメージを与え、お金を取り戻そう！

### 主要機能
- **認証機能**: Supabase Authによるメール・パスワード認証
- **オンボーディング**: 体重設定、ダイエット法選択、参加費設定
- **毎日の記録**: 体重、ダイエット成果、気分コメントの記録
- **ダッシュボード**: 進捗表示、マネーモンスター、統計情報
- **決済システム**: Stripe決済・返金システム
- **お問い合わせ機能**: メール送信システム
- **ゲーム終了処理**: 結果表示と新しいチャレンジ開始

### ゲームの流れ
1. **初日の設定**: 参加費がマネーモンスターの体力として表示
2. **毎日の記録**: 記録することでマネーモンスターにダメージ
3. **進捗表示**: マネーモンスターの体力と取り戻した金額をリアルタイム表示
4. **30日達成**: 記録日数に応じた返金とお祝いメッセージ

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Auth, Realtime)
- **決済**: Stripe
- **UI コンポーネント**: Lucide React (アイコン)
- **フォーム**: React Hook Form, Zod (バリデーション)
- **グラフ**: Recharts
- **日付処理**: date-fns
- **アナリティクス**: Google Analytics 4

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn
- Supabase アカウント
- Stripe アカウント（決済機能使用時）
- Google Analytics アカウント（アナリティクス機能使用時）

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd diet-challenge
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.local.example .env.local
```

`.env.local` ファイルを編集して必要な環境変数を設定：

```env
# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Server Actions / Route Handler 等のサーバー専用
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe（決済機能を使う場合）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key



# Google Analytics（アナリティクス機能を使う場合）
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

4. データベースセットアップ

Supabaseプロジェクトで以下のマイグレーションを実行してください：

- プロフィールテーブル作成
- チャレンジテーブル作成
- ダイエット法テーブル作成
- 日次記録テーブル作成
- お問い合わせテーブル作成

5. 開発サーバー起動
```bash
npm run dev
```

## データベース構造

### 主要テーブル
- `profiles`: ユーザープロフィール
- `challenges`: 30日チャレンジ情報
- `diet_methods`: デフォルトダイエット法
- `custom_diet_methods`: ユーザーカスタムダイエット法
- `challenge_diet_methods`: チャレンジとダイエット法の関連
- `daily_records`: 毎日の記録
- `diet_execution_records`: ダイエット法実行記録
- `contact_messages`: お問い合わせメッセージ

### RLS (Row Level Security)
すべてのテーブルでRLSが有効化されており、ユーザーは自分のデータのみアクセス可能です。

## API エンドポイント



### `/api/stripe/create-payment-intent`
- **POST**: Stripe決済インテント作成

### `/api/stripe/process-refund`
- **POST**: 返金処理

## 返金システム

### 初級プラン (MVP)
- 返金計算: `参加費 × 記録成功日数 ÷ 30日`
- 記録すれば成功日としてカウント（ダイエット成功/失敗に関わらず）
- 30日間毎日記録した場合：満額返金

### 今後の拡張予定
- **中級プラン**: ダイエット成功日数に応じた返金
- **上級プラン**: 厳格なルールによる満額返金または返金なし

## デプロイ

### Vercel
```bash
npm run build
```

Vercelにデプロイし、環境変数を設定してください。

### 環境変数の設定
本番環境では以下の環境変数が必要です：
- Supabase の URL と API キー
- Stripe の API キー
- メール送信設定（お問い合わせ機能用）

## 貢献

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ライセンス

MIT License

## サポート

お問い合わせ: yabaichemistryteacher@gmail.com