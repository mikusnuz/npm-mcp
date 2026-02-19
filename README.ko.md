[English](README.md) | **한국어** | [中文](README.zh.md) | [日本語](README.ja.md)

# npm-mcp

[![npm version](https://img.shields.io/npm/v/@mikusnuz%2Fnpm-mcp)](https://www.npmjs.com/package/@mikusnuz/npm-mcp)
[![MCP Badge](https://lobehub.com/badge/mcp/mikusnuz-npm-mcp)](https://lobehub.com/mcp/mikusnuz-npm-mcp)

AI 어시스턴트가 npm 패키지를 관리할 수 있게 해주는 MCP 서버입니다. 퍼블리시, 버전 관리, 검색, 감사 등을 Claude Code나 다른 MCP 클라이언트를 통해 수행할 수 있습니다.

## 왜 필요한가

Claude Code에서 라이브러리를 개발하고 있습니다. 코드를 완성했고 이제 퍼블리시해야 합니다. 터미널로 전환하는 대신:

```
You: publish this package to npm with public access
Claude: [calls publish tool] Published @yourorg/lib@1.0.0 successfully
```

끝입니다. 컨텍스트 전환이 필요 없습니다.

## 설정

### 1. 설치

```bash
git clone https://github.com/mikusnuz/npm-mcp.git
cd npm-mcp
npm install
npm run build
```

### 2. npm 토큰 발급

[npmjs.com](https://www.npmjs.com) > Account > Access Tokens > **Generate New Token** (Automation 타입 권장)으로 이동합니다.

### 3. Claude Code에 추가

`~/.claude/settings.json`을 수정합니다:

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

또는 이미 로컬에서 `npm login`을 실행했다면 `NPM_TOKEN`을 생략해도 됩니다. `~/.npmrc`를 자동으로 사용합니다.

## 도구

| Tool | 설명 |
|------|-----|
| `publish` | npm 레지스트리에 패키지를 퍼블리시합니다 |
| `version` | 패키지 버전을 올립니다 (patch/minor/major) |
| `view` | 레지스트리에서 패키지 정보를 조회합니다 |
| `search` | npm 레지스트리를 검색합니다 |
| `unpublish` | 패키지 버전을 제거합니다 |
| `deprecate` | 버전을 deprecated로 표시합니다 |
| `owner` | 패키지 소유자를 관리합니다 (ls/add/rm) |
| `dist-tag` | 배포 태그를 관리합니다 (ls/add/rm) |
| `pack` | 퍼블리시될 내용을 미리 확인합니다 |
| `whoami` | 현재 인증된 사용자를 확인합니다 |
| `init` | 새 package.json을 초기화합니다 |
| `audit` | 보안 감사를 실행합니다 |

## 예제

**스코프 패키지 퍼블리시:**
```
publish({ path: "/home/user/my-lib", access: "public" })
```

**버전 올리고 퍼블리시:**
```
version({ path: "/home/user/my-lib", bump: "patch" })
publish({ path: "/home/user/my-lib" })
```

**퍼블리시 전 내용 확인:**
```
pack({ path: "/home/user/my-lib", dryRun: true })
```

**기존 패키지 검색:**
```
search({ query: "react state management", limit: 5 })
```

**패키지 상세 정보 조회:**
```
view({ package: "@yourorg/lib", field: "versions" })
```

## 인증

| 방법 | 설명 |
|------|-----|
| **NPM_TOKEN** (권장) | MCP 설정에서 `NPM_TOKEN` 환경변수를 설정합니다. npmjs.com > Access Tokens에서 토큰을 발급받습니다 |
| **npm login** | 터미널에서 먼저 `npm login`을 실행합니다. `~/.npmrc`에 저장된 토큰이 자동으로 사용됩니다 |

2FA가 활성화된 계정의 경우, publish/unpublish/deprecate/owner 도구에 `otp` 파라미터를 전달합니다.

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `NPM_TOKEN` | -- | npm 인증 토큰 |
| `NPM_PATH` | `npm` | npm 바이너리 경로 (PATH에 없는 경우) |

## 라이선스

MIT
