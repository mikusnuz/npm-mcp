[English](README.md) | **한국어** | [中文](README.zh.md) | [日本語](README.ja.md)

# npm-mcp

[![npm version](https://img.shields.io/npm/v/@mikusnuz%2Fnpm-mcp)](https://www.npmjs.com/package/@mikusnuz/npm-mcp)
[![MCP Badge](https://lobehub.com/badge/mcp/mikusnuz-npm-mcp)](https://lobehub.com/mcp/mikusnuz-npm-mcp)

AI 어시스턴트가 npm 패키지를 관리할 수 있게 해주는 MCP 서버입니다. 퍼블리시, 버전 관리, 검색, 감사, 설치 등을 Claude Code나 다른 MCP 클라이언트를 통해 수행할 수 있습니다.

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

[npmjs.com](https://www.npmjs.com) > Account > Access Tokens에서 필요한 패키지
권한으로 **granular access token**을 만드세요. Classic/Automation 토큰은 더 이상
지원되지 않습니다. stage-only 토큰은 아래 `stage` 절차를 사용하며, 기존
`npm login` 인증도 사용할 수 있습니다.

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

### 퍼블리시 & 버전 관리

| 도구 | 설명 |
|------|-----|
| `publish` | npm 레지스트리에 패키지를 퍼블리시합니다 |
| `stage` | 버전을 스테이징하고 목록/상세/다운로드/승인/거절을 처리합니다 |
| `version` | 패키지 버전을 올립니다 (patch/minor/major/pre*) |
| `unpublish` | 패키지 버전을 제거합니다 |
| `deprecate` | 버전을 deprecated로 표시합니다 (빈 메시지로 해제 가능) |
| `pack` | 퍼블리시될 내용을 미리 확인합니다 |

### 패키지 정보

| 도구 | 설명 |
|------|-----|
| `view` | 레지스트리에서 패키지 정보를 조회합니다 |
| `search` | npm 레지스트리를 검색합니다 |
| `bugs` | 패키지의 버그 트래커 URL을 조회합니다 |
| `repo` | 패키지의 저장소 URL을 조회합니다 |
| `docs` | 패키지의 문서 URL을 조회합니다 |
| `diff` | 패키지 버전 간 차이점을 확인합니다 |

### 의존성 관리

| 도구 | 설명 |
|------|-----|
| `install` | 패키지를 설치합니다 |
| `uninstall` | 패키지를 제거합니다 |
| `update` | 패키지를 최신 semver 호환 버전으로 업데이트합니다 |
| `outdated` | 오래된 패키지를 확인합니다 |
| `ls` | 설치된 패키지를 나열합니다 |
| `explain` | 패키지가 설치된 이유를 설명합니다 |
| `dedupe` | 의존성 트리의 중복을 줄입니다 |
| `prune` | 불필요한 패키지를 제거합니다 |
| `fund` | 의존성의 후원 정보를 표시합니다 |
| `query` | CSS 스타일 선택자로 패키지를 조회합니다 |

### 보안 & 진단

| 도구 | 설명 |
|------|-----|
| `audit` | 보안 감사를 실행합니다 (자동 수정 지원) |
| `sbom` | SBOM(소프트웨어 자재 명세서)을 생성합니다 (CycloneDX/SPDX) |
| `doctor` | npm 환경 상태를 진단합니다 |
| `ping` | 레지스트리 연결을 확인합니다 |

### 설정 & 인증

| 도구 | 설명 |
|------|-----|
| `whoami` | 현재 인증된 사용자를 확인합니다 |
| `token` | 액세스 토큰을 관리합니다 (list/revoke) |
| `access` | 패키지의 접근 수준을 설정하거나 조회합니다 |
| `owner` | 패키지 소유자를 관리합니다 (ls/add/rm) |
| `dist-tag` | 배포 태그를 관리합니다 (ls/add/rm) |
| `profile` | npm 프로필 설정을 조회하거나 수정합니다 |
| `config` | npm 설정을 조회합니다 (읽기 전용) |

### 프로젝트 설정

| 도구 | 설명 |
|------|-----|
| `init` | 새 package.json을 초기화합니다 |
| `pkg` | package.json 필드를 프로그래밍 방식으로 관리합니다 |
| `ci` | 잠금 파일로 클린 설치합니다 (CI 용) |
| `run-script` | package.json에 정의된 스크립트를 실행합니다 |
| `link` | 로컬 패키지를 심링크로 연결합니다 |
| `cache` | npm 캐시를 관리합니다 |

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

**패키지 설치:**
```
install({ path: "/home/user/my-app", packages: ["express", "cors"], saveDev: false })
```

**오래된 의존성 확인:**
```
outdated({ path: "/home/user/my-app" })
```

**버전 비교:**
```
diff({ specs: ["lodash@4.17.20", "lodash@4.17.21"] })
```

**SBOM 생성:**
```
sbom({ path: "/home/user/my-app", format: "spdx", production: true })
```

**의존성 쿼리:**
```
query({ path: "/home/user/my-app", selector: ":root > .prod" })
```

## 인증

`stage`는 npm CLI **11.15.0 이상**, Node.js **22.14.0 이상**이 필요합니다.
`npm stage --help`로 확인하고 필요한 경우 `NPM_PATH`로 해당 실행 파일을 지정하세요.
[공식 최소 요구사항](https://docs.npmjs.com/staged-publishing/)

```js
stage({ action: "publish", path: "/home/user/my-lib", access: "public" })
stage({ action: "list", package: "@yourorg/lib" })
stage({ action: "view", stageId: "반환된-stage-id" })
stage({ action: "download", stageId: "반환된-stage-id", path: "/home/user/review" })
stage({ action: "approve", stageId: "반환된-stage-id", otp: "123456" })
```

스테이징만으로는 공개되지 않고 `approve`가 실제 발행합니다. `approve`와 `reject`는
관리자의 2FA를 요구합니다. `dryRun`은 `action: "publish"`에서만 사용하세요.
stage-only 토큰으로 직접 발행하면 `E_STAGE_REQUIRED`가 발생합니다. npm은 granular
토큰 직접 발행을 2027년 1월 제거할 예정입니다.
[공식 stage 문서](https://docs.npmjs.com/cli/v11/commands/npm-stage/) ·
[토큰 정책](https://docs.npmjs.com/about-access-tokens/)

`pkg`의 `value`에는 문자열, 숫자, 불리언, null, 배열, 객체를 그대로 전달합니다.
예: `value: { test: "node --test" }`. 배열·객체를 문자열로 변환하지 마세요.
2026년 8월부터 계정·유지관리자·토큰 변경은 bypass-2FA 토큰으로도 2FA를 생략할 수
없습니다. 만료된 토큰은 갱신하거나 `npm login`으로 다시 인증해야 합니다.

| 방법 | 설명 |
|------|-----|
| **NPM_TOKEN** (권장) | MCP 설정에서 `NPM_TOKEN` 환경변수를 설정합니다. npmjs.com > Access Tokens에서 토큰을 발급받습니다 |
| **npm login** | 터미널에서 먼저 `npm login`을 실행합니다. `~/.npmrc`에 저장된 토큰이 자동으로 사용됩니다 |

2FA가 활성화된 계정의 경우, publish/unpublish/deprecate/owner/access/token 도구에 `otp` 파라미터를 전달합니다.

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `NPM_TOKEN` | -- | npm 인증 토큰 |
| `NPM_PATH` | `npm` | npm 바이너리 경로 (PATH에 없는 경우) |

## 라이선스

MIT
