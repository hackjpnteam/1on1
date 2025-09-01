# 1on1管理サービス MVP

Next.js + MongoDB + NextAuth (Google OAuth) を使用した社内向け1on1管理サービス

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database**: MongoDB (Mongoose)
- **Authentication**: NextAuth.js (Google OAuth)
- **State Management**: SWR

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定:

```env
# 必須
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MONGODB_URI=mongodb://localhost:27017/oneonone

# オプション
ADMIN_EMAILS=admin@example.com
SLACK_WEBHOOK_URL=
NEXT_PUBLIC_APP_NAME=OneOnOne
```

### 2. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. OAuth 2.0 クライアントIDを作成
3. 承認済みリダイレクトURIに`http://localhost:3000/api/auth/callback/google`を追加

### 3. MongoDBセットアップ

- ローカル: MongoDB Community Editionをインストール
- クラウド: MongoDB Atlasで無料クラスターを作成

### 4. 依存関係のインストール

```bash
npm install
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します

## 主な機能

- **認証**: Google OAuthによるログイン
- **ペアリング**: 上司・部下のペア登録（管理者のみ）
- **1on1セッション**: 予定作成、実施記録、メモ管理
- **評価**: 5段階評価とコメント
- **タイムライン**: 全社の1on1活動を時系列表示
- **ダッシュボード**: 実施率などのKPI表示

## デプロイ

### Vercel

1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. デプロイ

### MongoDB Atlas

1. MongoDB Atlasでクラスターを作成
2. 接続文字列を`MONGODB_URI`に設定
3. ネットワークアクセスを設定

## スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバー起動
- `npm run lint` - ESLintの実行