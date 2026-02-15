[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md) | **日本語**

# npm-mcp

AIアシスタントがnpmパッケージを管理できるようにするMCPサーバーです。Claude CodeやあらゆるMCPクライアントを通じて、公開、バージョン管理、検索、監査を実行できます。

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

| ツール | 説明 |
|------|-------------|
| `publish` | npmレジストリにパッケージを公開 |
| `version` | パッケージバージョンの更新 (patch/minor/major) |
| `view` | レジストリからパッケージ情報を表示 |
| `search` | npmレジストリを検索 |
| `unpublish` | パッケージバージョンを削除 |
| `deprecate` | バージョンを非推奨化 |
| `owner` | パッケージオーナーを管理 (ls/add/rm) |
| `dist-tag` | ディストリビューションタグを管理 (ls/add/rm) |
| `pack` | 公開される内容をプレビュー |
| `whoami` | 現在認証されているユーザーを確認 |
| `init` | 新しいpackage.jsonを初期化 |
| `audit` | セキュリティ監査を実行 |

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

## 認証

| 方法 | 手順 |
|--------|-----|
| **NPM_TOKEN** (推奨) | MCP設定で`NPM_TOKEN`環境変数を設定します。npmjs.com > Access Tokensからトークンを取得してください |
| **npm login** | 先にターミナルで`npm login`を実行します。`~/.npmrc`に保存されたトークンが自動的に使用されます |

2FAが有効なアカウントの場合、publish/unpublish/deprecate/ownerツールに`otp`パラメータを渡してください。

## 環境変数

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `NPM_TOKEN` | -- | npm認証トークン |
| `NPM_PATH` | `npm` | npmバイナリのパス (PATHにない場合) |

## ライセンス

MIT
