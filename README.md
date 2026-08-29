# FlowCraft

フローチャート作成とマニュアル作成を一体化したアプリ。React Flowでノード（ステップ）を配置し、各ノードにMarkdownでマニュアルを紐付けられます。

## 開発

```bash
npm install
npm run dev
```

## 主な機能

- フローチャート編集（ノードの追加・接続・ドラッグ）
- 各ステップへのMarkdownマニュアル付与（編集/プレビュー切替）
- 複数フローの管理・編集/閲覧モード切替
- JSONファイルへのエクスポート/インポート
- フロー全体をPNG画像としてクリップボードにコピー、またはファイル保存（Excelなどに貼り付け可能）
- Googleドライブへの保存/読み込み

## Googleドライブ連携のセットアップ

Googleドライブへの保存・読み込み機能を使うには、自分のGoogleアカウントでOAuthクライアントIDを取得する必要があります（この作業はGoogleアカウントの操作が必要なため、ユーザー自身で行ってください）。

1. [Google Cloud Console](https://console.cloud.google.com/) で新規プロジェクトを作成（または既存のものを選択）
2. 「APIとサービス」→「有効なAPIとサービス」から **Google Drive API** を有効化
3. 「APIとサービス」→「OAuth同意画面」を設定（User Type: 外部、テスト中でOK。自分のGoogleアカウントをテストユーザーに追加）
4. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuthクライアントID」
   - アプリケーションの種類: **ウェブアプリケーション**
   - 承認済みのJavaScript生成元に `http://localhost:5173`（開発用）と、本番公開する場合はそのURLを追加
5. 発行された **クライアントID** をコピー
6. プロジェクト直下に `.env.local` ファイルを作成し、以下を記載:

```
VITE_GOOGLE_CLIENT_ID=あなたのクライアントID.apps.googleusercontent.com
```

7. 開発サーバーを再起動（`npm run dev`）すると、ツールバーの「Driveに保存」「Driveから開く」が使えるようになります

`.env.local` は `.gitignore` で除外済みなので、誤ってGitHubに公開される心配はありません。

権限スコープは `drive.file`（このアプリが作成したファイルのみアクセス可能）を使用しているため、Googleドライブ内の他のファイルにはアクセスしません。
