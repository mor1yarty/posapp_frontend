# POSアプリケーション - フロントエンド (Next.js)

モバイルPOSシステムのフロントエンド実装です。Next.js 14とTypeScriptを使用したモダンなReactアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 14.0.3
- **言語**: TypeScript 5
- **HTTP クライアント**: Axios 1.6.2
- **スタイリング**: CSS Modules
- **テスト**: Playwright 1.52.0

## 機能

### 商品検索機能
- JANコード（商品コード）の入力
- バックエンドAPIを通じた商品マスタ検索
- 商品情報（品名、色、品番、価格）の表示

### 購入リスト管理
- 商品の購入リストへの追加
- リアルタイム合計金額計算
- 購入品目の数量管理
- 個別商品の削除機能

### 購入処理
- 購入データのバックエンドへの送信
- 購入完了時の成功メッセージ表示
- 購入後のリストクリア

### UI/UX
- レスポンシブデザイン対応
- エラーハンドリング
- 直感的な操作インターフェース
- リアルタイムフィードバック

## ディレクトリ構成

```
pos-app-frontend/
├── src/
│   ├── app/
│   │   ├── globals.css         # グローバルスタイル
│   │   ├── layout.tsx          # アプリケーションレイアウト
│   │   └── page.tsx            # メインPOSページ
│   ├── components/             # 再利用可能コンポーネント
│   ├── config/
│   │   └── index.ts            # アプリケーション設定管理
│   └── types/
│       └── index.ts            # TypeScript型定義
├── tests/
│   └── pos-app.spec.ts         # E2Eテスト
├── .env.local                  # 開発環境用環境変数
├── .env.example                # 本番環境用環境変数例
├── package.json                # 依存関係とスクリプト
├── next.config.js              # Next.js設定（環境変数対応）
├── tsconfig.json               # TypeScript設定
├── playwright.config.ts        # Playwrightテスト設定
├── Dockerfile                  # Dockerコンテナ設定
└── README.md
```

## 環境設定

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバーの起動
npm start
```

### 環境変数

環境変数を使用してAPIエンドポイントやその他の設定を管理しています。

#### 開発環境設定
`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# API設定
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 開発環境設定
NODE_ENV=development
```

#### 本番環境設定
本番環境では以下の環境変数を設定してください：

```bash
# API設定
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com

# 環境設定
NODE_ENV=production
```

#### 設定管理
アプリケーション内では`src/config/index.ts`で設定を一元管理しています：

```typescript
import { API_CONFIG } from '@/config';

// API呼び出しの例
const response = await fetch(`${API_CONFIG.baseURL}/api/products`);
```

Next.js設定ファイル（`next.config.js`）でAPIプロキシが設定されており、環境変数から動的にバックエンドAPIのURLを取得します。

## 開発

### 開発サーバー起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で利用可能になります。

### テスト実行

```bash
# E2Eテストの実行
npm run test:e2e

# テストレポートの表示
npm run test:report
```

## API連携

フロントエンドは以下のバックエンドAPIエンドポイントと連携します：

- `GET /api/products/{code}` - 商品マスタ検索
- `POST /api/purchase` - 購入処理

## コンポーネント設計

### メインページ (`page.tsx`)
- 商品検索フォーム
- 購入リスト表示
- 購入処理実行

### 主要な状態管理
- `searchCode`: 商品検索コード
- `foundProduct`: 検索された商品情報
- `purchaseList`: 購入リスト
- `totalAmount`: 合計金額
- `message`: ユーザーメッセージ

## スタイリング

カスタムCSSを使用したレスポンシブデザイン：
- モバイルファーストアプローチ
- 清潔で直感的なUI
- 視覚的フィードバック
- アクセシビリティ考慮

## Docker対応

```bash
# イメージのビルド
docker build -t pos-frontend .

# コンテナの実行
docker run -p 3000:3000 pos-frontend
```

## デプロイ

### Azure Web App
このアプリケーションはAzure Web App (Node.js)でのデプロイを前提として設計されています。

#### 環境変数設定
デプロイ時には以下の環境変数を設定してください：

- `NEXT_PUBLIC_API_BASE_URL`: バックエンドAPIのURL
- `NODE_ENV`: 実行環境（production）

詳細なデプロイ手順については、プロジェクトルートの `azure-deployment.md` を参照してください。

## 開発ガイドライン

- TypeScriptの厳密な型チェックを活用
- コンポーネントの再利用性を考慮
- エラーハンドリングの適切な実装
- レスポンシブデザインの維持
- アクセシビリティの配慮

## トラブルシューティング

### よくある問題

1. **API接続エラー**
   - バックエンドサーバーが起動していることを確認
   - ポート8000でバックエンドが動作していることを確認

2. **ビルドエラー**
   - `npm install` で依存関係を再インストール
   - Node.jsのバージョンを確認（18以上推奨）

3. **テスト失敗**
   - バックエンドAPIが起動していることを確認
   - データベースにサンプルデータが投入されていることを確認

4. **環境変数が読み込まれない**
   - `.env.local`ファイルが正しい場所にあることを確認
   - 環境変数名が`NEXT_PUBLIC_`プレフィックスで始まることを確認
   - 開発サーバーを再起動（`npm run dev`）

5. **API接続設定エラー**
   - `src/config/index.ts`で設定値を確認
   - 環境変数`NEXT_PUBLIC_API_BASE_URL`が正しく設定されていることを確認

## ライセンス

このプロジェクトは教育目的で作成されています。
