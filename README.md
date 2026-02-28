# 中京UMEBO

中京大学の学生向けモバイルアプリ。大学の複数システム（MaNaBo・CUBICS・Albo）のデータを統合し、時間割・課題・スクールバス・学年暦などを一つのアプリで確認できます。

## 技術スタック

| カテゴリ         | 技術                                                       |
| ---------------- | ---------------------------------------------------------- |
| フレームワーク   | React Native + Expo (SDK 54)                               |
| ルーティング     | Expo Router（ファイルベースルーティング）                  |
| スタイリング     | NativeWind (Tailwind CSS) + tailwind-variants              |
| 状態管理         | Zustand / React Context                                    |
| バリデーション   | Zod                                                        |
| 認証             | Firebase Auth + Google Sign-In + Shibboleth SSO            |
| バックエンド連携 | Firebase (Analytics, Remote Config, Messaging) + UMEBO API |
| ストレージ       | expo-secure-store / AsyncStorage                           |
| 言語             | TypeScript (strict mode)                                   |

## アーキテクチャ

レイヤードアーキテクチャを採用しています。

```
Presentation（画面・コンポーネント・Context・Hooks）
    ↓
Domain（ビジネスロジック・サービス）
    ↓
Data（リポジトリ → プロバイダー + クライアント）
    ↓
Common（型定義・エラー・定数）
```

### 各レイヤーの責務

- **Presentation** — Expo Routerの画面定義、UIコンポーネント（ui / parts / template）、認証状態やShibbolethのReact Context
- **Domain** — Google Sign-InやFirebase Auth認証のオーケストレーション等のビジネスロジック
- **Data** — リポジトリが複数プロバイダーを統合し、キャッシュ管理やAPIへのデータ同期を担当。プロバイダーは大学ポータル（Albo, CUBICS, MaNaBo）やUMEBO API、Firebase、SecureStoreへの低レベルアクセスを提供
- **Common** — URL定数、Zodスキーマ、カスタムエラークラスなどの共有リソース

## ディレクトリ構成

```
src/
├── app/                        # Expo Router 画面定義
│   ├── _layout.tsx             # ルートレイアウト（認証ガード・プロバイダー初期化）
│   ├── force-update.tsx        # 強制アップデート画面
│   ├── maintenance.tsx         # メンテナンス画面
│   ├── (tabs)/                 # メインタブ画面群
│   │   ├── index.tsx           # ホーム（お知らせ・今日の時間割・バス）
│   │   ├── assignment.tsx      # 課題一覧
│   │   ├── bus.tsx             # スクールバス時刻表
│   │   ├── calendar.tsx        # 学年暦
│   │   └── timetable.tsx       # 時間割（5×5グリッド）
│   └── login/                  # ログイン・オンボーディングフロー
│       ├── index.tsx           # Google Sign-In
│       ├── campus.tsx          # キャンパス選択
│       ├── notification.tsx    # 通知許可
│       ├── password.tsx        # CU_IDパスワード入力
│       └── terms.tsx           # 利用規約同意
├── common/
│   ├── constants/urls.ts       # URL定数
│   ├── errors/                 # カスタムエラークラス群
│   └── types/                  # Zodスキーマ・型定義
├── data/
│   ├── clients/
│   │   ├── chukyo-shibboleth.tsx  # Shibboleth SSO認証（隠しWebView）
│   │   └── httpClient.ts         # HTTPクライアント（タイムアウト・エラーハンドリング）
│   ├── provider/
│   │   ├── cache.ts            # AsyncStorageキャッシュ
│   │   ├── firebase.ts         # Firebase IDトークン管理
│   │   ├── remote-config.ts    # Firebase Remote Config
│   │   ├── storage.ts          # SecureStore（認証情報保存）
│   │   ├── umebo-api.ts        # UMEBO バックエンドAPI
│   │   └── chukyo-univ/        # 大学システムプロバイダー
│   │       ├── abstractChukyoProvider.ts  # Shibboleth認証基底クラス
│   │       ├── albo.ts         # Albo（ポータル・学年暦・お知らせ）
│   │       ├── cubics.ts       # CUBICS（教務システム・時間割）
│   │       └── manabo.ts       # MaNaBo（LMS・課題・授業コンテンツ）
│   └── repositories/           # データ統合・キャッシュ戦略
│       ├── app-info.ts         # アプリバージョン・メンテナンス判定
│       ├── assignment.ts       # 課題データ取得・同期
│       ├── auth.ts             # 認証状態管理
│       ├── calendar.ts         # 学年暦データ取得
│       ├── class-data.ts       # 授業コンテンツ・ディレクトリ取得
│       └── timetable.ts        # 時間割データ取得・統合・同期
├── domain/
│   └── services/
│       ├── auth.ts             # サインアウト・CU_IDログイン
│       └── google-signin.ts    # Google Sign-In・ドメイン検証
└── presentation/
    ├── components/
    │   ├── ui/                 # 最小UIコンポーネント（Button, Card, Text, Badge等）
    │   ├── parts/              # 再利用可能なパーツ（ClassCard, Footer, QuickAccessIcon）
    │   └── template/           # 画面テンプレート（MainTemplate + Header）
    ├── contexts/               # React Context（認証状態・Shibboleth）
    └── hooks/                  # カスタムフック
```

## 主要なデータフロー

### ログインフロー

1. Google Sign-In でメールアドレス認証（`m.chukyo-u.ac.jp` ドメイン限定）
2. Firebase Auth にGoogle資格情報でサインイン
3. UMEBO API `/v1/auth/login` にFirebase IDトークンで認証
4. キャンパス選択 → 通知許可 → CU_IDパスワード入力 → 利用規約同意
5. CU_IDとパスワードをSecureStoreに保存

### データ取得フロー

1. 画面がリポジトリを呼び出し
2. リポジトリはまずUMEBO API（Firebase IDトークン付き）からデータ取得を試行
3. 失敗時はAsyncStorageキャッシュにフォールバック
4. 取得したデータを画面に表示

### データ更新フロー（Pull-to-Refresh）

1. SecureStoreから認証情報を取得
2. Shibboleth WebView経由でMaNaBo / CUBICS / Alboに認証
3. 各大学システムのHTMLをスクレイピング・パース
4. データを統合・整形してUMEBO APIにPOST
5. ローカルキャッシュを更新

## セットアップ

### 前提条件

- Node.js
- Expo CLI
- iOS: Xcode / Android: Android Studio

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# ネイティブビルド（開発用）
npm run prebuild
npm run devbuild:android  # Android
npm run devbuild:ios      # iOS
```

### ビルド

```bash
# 本番ビルド
npm run build:android     # → production.aab
npm run build:ios         # → production.ipa
```

### コード品質

```bash
npm run lint              # ESLint
npm run typecheck         # TypeScript型チェック
npm run format            # Prettier フォーマット
```

## コンポーネント設計方針

- **ui** — 最小単位のUIコンポーネント（Button, Card, Text, Badge, Accordion等）
- **parts** — 複数のuiコンポーネントを組み合わせた再利用可能なパーツ
- **template** — 画面全体のレイアウトテンプレート
- フォントサイズは `rem` を使用
- データはハードコーディングせず、props経由で受け取る
