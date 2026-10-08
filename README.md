**English** | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md)

# npm-mcp

[![npm version](https://img.shields.io/npm/v/@mikusnuz%2Fnpm-mcp)](https://www.npmjs.com/package/@mikusnuz/npm-mcp)
[![MCP Badge](https://lobehub.com/badge/mcp/mikusnuz-npm-mcp)](https://lobehub.com/mcp/mikusnuz-npm-mcp)

MCP server that lets AI assistants manage npm packages. Publish, version, search, audit, install, and more -- all through Claude Code or any MCP client.

## When to Use

| Task | Tool |
|------|------|
| "Publish this package to npm" | `publish` |
| "Check for outdated dependencies" | `outdated` |
| "Run a security audit on my packages" | `audit` |
| "Search npm for authentication libraries" | `search` |
| "Bump the version and publish" | `version` then `publish` |
| "Check who owns this npm package" | `owner` |
| "View download stats for my package" | `view` |

> **For AI agents:** See [`llms.txt`](llms.txt) for a machine-readable summary. Copy [`templates/CLAUDE.md`](templates/CLAUDE.md) or [`templates/AGENTS.md`](templates/AGENTS.md) into your project to teach your agent about this MCP.

## Why

You're in Claude Code building a library. You finish the code, and now you need to publish it. Instead of switching to a terminal:

```
You: publish this package to npm with public access
Claude: [calls publish tool] Published @yourorg/lib@1.0.0 successfully
```

That's it. No context switching.

## Setup

### 1. Install

```bash
git clone https://github.com/mikusnuz/npm-mcp.git
cd npm-mcp
npm install
npm run build
```

### 2. Get npm token

Go to [npmjs.com](https://www.npmjs.com) > Account > Access Tokens and create a
**granular access token** with access to the packages you need. Classic and
Automation tokens are no longer supported. A stage-only token uses the `stage`
workflow below. Existing `npm login` credentials also work.

### 3. Add to Claude Code

Edit `~/.claude/settings.json`:

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

Or if you've already run `npm login` locally, skip `NPM_TOKEN` -- it uses your `~/.npmrc` automatically.

## Tools

### Publishing & Versioning

| Tool | Description |
|------|-------------|
| `publish` | Publish a package to npm registry |
| `stage` | Stage, list, inspect, download, approve, or reject a pending package version |
| `version` | Bump package version (patch/minor/major/pre*) |
| `unpublish` | Remove a package version |
| `deprecate` | Deprecate a version (or undeprecate with empty message) |
| `pack` | Preview what would be published |

### Package Info

| Tool | Description |
|------|-------------|
| `view` | View package info from registry |
| `search` | Search npm registry |
| `bugs` | Get bug tracker URL for a package |
| `repo` | Get repository URL for a package |
| `docs` | Get documentation URL for a package |
| `diff` | Show diff between package versions |

### Dependency Management

| Tool | Description |
|------|-------------|
| `install` | Install packages |
| `uninstall` | Remove packages |
| `update` | Update packages to latest semver-compatible version |
| `outdated` | Check for outdated packages |
| `ls` | List installed packages |
| `explain` | Explain why a package is installed |
| `dedupe` | Reduce duplication in dependency tree |
| `prune` | Remove extraneous packages |
| `fund` | Show funding info for dependencies |
| `query` | Query packages using CSS-like selectors |

### Security & Diagnostics

| Tool | Description |
|------|-------------|
| `audit` | Run security audit (with optional auto-fix) |
| `sbom` | Generate Software Bill of Materials (CycloneDX/SPDX) |
| `doctor` | Check npm environment health |
| `ping` | Check registry connectivity |

### Configuration & Auth

| Tool | Description |
|------|-------------|
| `whoami` | Check current authenticated user |
| `token` | Manage access tokens (list/revoke) |
| `access` | Set or view access level on packages |
| `owner` | Manage package owners (ls/add/rm) |
| `dist-tag` | Manage distribution tags (ls/add/rm) |
| `profile` | View or modify npm profile settings |
| `config` | View npm configuration (read-only) |

### Project Setup

| Tool | Description |
|------|-------------|
| `init` | Initialize a new package.json |
| `pkg` | Manage package.json fields programmatically |
| `ci` | Clean install from lockfile (for CI) |
| `run-script` | Run scripts defined in package.json |
| `link` | Symlink a local package for development |
| `cache` | Manage the npm cache |

## Examples

**Publish a scoped package:**
```
publish({ path: "/home/user/my-lib", access: "public" })
```

**Bump version and publish:**
```
version({ path: "/home/user/my-lib", bump: "patch" })
publish({ path: "/home/user/my-lib" })
```

**Check what's inside before publishing:**
```
pack({ path: "/home/user/my-lib", dryRun: true })
```

**Search for existing packages:**
```
search({ query: "react state management", limit: 5 })
```

**View package details:**
```
view({ package: "@yourorg/lib", field: "versions" })
```

**Install packages:**
```
install({ path: "/home/user/my-app", packages: ["express", "cors"], saveDev: false })
```

**Check outdated dependencies:**
```
outdated({ path: "/home/user/my-app" })
```

**Compare versions:**
```
diff({ specs: ["lodash@4.17.20", "lodash@4.17.21"] })
```

**Generate SBOM:**
```
sbom({ path: "/home/user/my-app", format: "spdx", production: true })
```

**Query dependencies:**
```
query({ path: "/home/user/my-app", selector: ":root > .prod" })
```

## Auth

### Staged publishing

Staged publishing requires npm CLI **11.15.0 or later** and Node.js **22.14.0
or later**. Check `npm stage --help`; `NPM_PATH` can select a separate npm
installation. See the [staged publishing prerequisites](https://docs.npmjs.com/staged-publishing/).

```js
stage({ action: "publish", path: "/home/user/my-lib", access: "public" })
stage({ action: "list", package: "@yourorg/lib" })
stage({ action: "view", stageId: "returned-stage-id" })
stage({ action: "download", stageId: "returned-stage-id", path: "/home/user/review" })
stage({ action: "approve", stageId: "returned-stage-id", otp: "123456" })
// Or reject the staged version:
stage({ action: "reject", stageId: "returned-stage-id", otp: "123456" })
```

Staging does not publish the package; approval does. Approval and rejection
require maintainer 2FA. `dryRun` applies only to `stage` with `action: "publish"`.
A direct publish with a stage-only token returns `E_STAGE_REQUIRED`. npm plans
to remove direct publishing with granular tokens in January 2027.
See [npm staging](https://docs.npmjs.com/cli/v11/commands/npm-stage/) and
[token requirements](https://docs.npmjs.com/about-access-tokens/).

`pkg` accepts JSON values directly: `value: "my-package"`, `value: true`,
`value: ["keyword"]`, or `value: { test: "node --test" }`. Strings stay strings;
do not stringify arrays or objects before passing them.

| Method | How |
|--------|-----|
| **NPM_TOKEN** (recommended) | Set `NPM_TOKEN` env var in MCP config. Get token from npmjs.com > Access Tokens |
| **npm login** | Run `npm login` in terminal first. Token saved in `~/.npmrc` is used automatically |

Pass `otp` when npm requires 2FA, including staged approval/rejection and package
maintainer or token changes. Since August 2026, bypass-2FA tokens cannot bypass
the second factor for account or governance operations. Tokens expire; renew
the configured token when needed or refresh local credentials with `npm login`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NPM_TOKEN` | -- | npm authentication token |
| `NPM_PATH` | `npm` | Path to npm binary (if not in PATH) |

## License

MIT
