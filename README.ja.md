[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md) | **日本語**

# npm-mcp

[![npm version](https://img.shields.io/npm/v/@mikusnuz%2Fnpm-mcp)](https://www.npmjs.com/package/@mikusnuz/npm-mcp)
[![MCP Badge](https://lobehub.com/badge/mcp/mikusnuz-npm-mcp)](https://lobehub.com/mcp/mikusnuz-npm-mcp)

AIアシスタントがnpmパッケージを管理できるようにするMCPサーバーです。Claude CodeやあらゆるMCPクライアントを通じて、公開、バージョン管理、検索、監査、インストールなどを実行できます。

## なぜ必要か

Claude Codeでライブラリを構築しているとします。コードが完成し、公開する必要が出てきます。ターミナルに切り替える代わりに:

```
あなた: このパッケージをpublic accessでnpmに公開して
Claude: [publishツールを呼び出し] @yourorg/lib@1.0.0を正常に公開しました
```

これだけです。コンテキストの切り替えは不要です。

## セットアップ

### 1. インストール

```bash
git clone https://github.com/mikusnuz/npm-mcp.git
cd npm-mcp
npm install
npm run build
```

### 2. npmトークンの取得

[npmjs.com](https://www.npmjs.com) > Account > Access Tokens > **Generate New Token** (Automationタイプを推奨)にアクセスします。

### 3. Claude Codeに追加

`~/.claude/settings.json`を編集します:

```json
{
  "mcpServers": {
    "npm-mcp": {
      "command": "node",
      "args": ["/path/to/npm-mcp/dist/index.js"],
      "env": {
        "NPM_TOKEN": "npm_xxxxxxxxxxxx"
      }
    }
  }
}
```

または、すでにローカルで`npm login`を実行済みの場合は、`NPM_TOKEN`をスキップしてください。`~/.npmrc`が自動的に使用されます。

## ツール

### パブリッシュ & バージョン管理

| ツール | 説明 |
|------|-------------|
| `publish` | npmレジストリにパッケージを公開 |
| `version` | パッケージバージョンの更新 (patch/minor/major/pre*) |
| `unpublish` | パッケージバージョンを削除 |
| `deprecate` | バージョンを非推奨化（空メッセージで解除可能） |
| `pack` | 公開される内容をプレビュー |

### パッケージ情報

| ツール | 説明 |
|------|-------------|
| `view` | レジストリからパッケージ情報を表示 |
| `search` | npmレジストリを検索 |
| `bugs` | パッケージのバグトラッカーURLを取得 |
| `repo` | パッケージのリポジトリURLを取得 |
| `docs` | パッケージのドキュメントURLを取得 |
| `diff` | パッケージバージョン間の差分を表示 |

### 依存関係管理

| ツール | 説明 |
|------|-------------|
| `install` | パッケージをインストール |
| `uninstall` | パッケージを削除 |
| `update` | パッケージをsemver互換の最新バージョンに更新 |
| `outdated` | 古いパッケージを確認 |
| `ls` | インストール済みパッケージを一覧表示 |
| `explain` | パッケージがインストールされた理由を説明 |
| `dedupe` | 依存関係ツリーの重複を削減 |
| `prune` | 不要なパッケージを削除 |
| `fund` | 依存関係の支援情報を表示 |
| `query` | CSSスタイルのセレクタでパッケージを検索 |

### セキュリティ & 診断

| ツール | 説明 |
|------|-------------|
| `audit` | セキュリティ監査を実行（自動修正対応） |
| `sbom` | ソフトウェア部品表を生成 (CycloneDX/SPDX) |
| `doctor` | npm環境の健全性を診断 |
| `ping` | レジストリへの接続を確認 |

### 設定 & 認証

| ツール | 説明 |
|------|-------------|
| `whoami` | 現在認証されているユーザーを確認 |
| `token` | アクセストークンを管理 (list/revoke) |
| `access` | パッケージのアクセスレベルを設定または表示 |
| `owner` | パッケージオーナーを管理 (ls/add/rm) |
| `dist-tag` | ディストリビューションタグを管理 (ls/add/rm) |
| `profile` | npmプロフィール設定を表示または変更 |
| `config` | npm設定を表示（読み取り専用） |

### プロジェクト設定

| ツール | 説明 |
|------|-------------|
| `init` | 新しいpackage.jsonを初期化 |
| `pkg` | package.jsonのフィールドをプログラムで管理 |
| `ci` | ロックファイルからクリーンインストール（CI用） |
| `run-script` | package.jsonで定義されたスクリプトを実行 |
| `link` | 開発用にローカルパッケージをシンボリックリンク |
| `cache` | npmキャッシュを管理 |

## 使用例

**スコープ付きパッケージの公開:**
```
publish({ path: "/home/user/my-lib", access: "public" })
```

**バージョン更新と公開:**
```
version({ path: "/home/user/my-lib", bump: "patch" })
publish({ path: "/home/user/my-lib" })
```

**公開前の内容確認:**
```
pack({ path: "/home/user/my-lib", dryRun: true })
```

**既存パッケージの検索:**
```
search({ query: "react state management", limit: 5 })
```

**パッケージ詳細の表示:**
```
view({ package: "@yourorg/lib", field: "versions" })
```

**パッケージのインストール:**
```
install({ path: "/home/user/my-app", packages: ["express", "cors"], saveDev: false })
```

**古い依存関係の確認:**
```
outdated({ path: "/home/user/my-app" })
```

**バージョンの比較:**
```
diff({ specs: ["lodash@4.17.20", "lodash@4.17.21"] })
```

**SBOMの生成:**
```
sbom({ path: "/home/user/my-app", format: "spdx", production: true })
```

**依存関係のクエリ:**
```
query({ path: "/home/user/my-app", selector: ":root > .prod" })
```

## 認証

| 方法 | 手順 |
|--------|-----|
| **NPM_TOKEN** (推奨) | MCP設定で`NPM_TOKEN`環境変数を設定します。npmjs.com > Access Tokensからトークンを取得してください |
| **npm login** | 先にターミナルで`npm login`を実行します。`~/.npmrc`に保存されたトークンが自動的に使用されます |

2FAが有効なアカウントの場合、publish/unpublish/deprecate/owner/access/tokenツールに`otp`パラメータを渡してください。

## 環境変数

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `NPM_TOKEN` | -- | npm認証トークン |
| `NPM_PATH` | `npm` | npmバイナリのパス (PATHにない場合) |

## ライセンス

MIT
