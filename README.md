**English** | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md)

# npm-mcp

MCP server that lets AI assistants manage npm packages. Publish, version, search, audit -- all through Claude Code or any MCP client.

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

Go to [npmjs.com](https://www.npmjs.com) > Account > Access Tokens > **Generate New Token** (Automation type recommended).

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

| Tool | Description |
|------|-------------|
| `publish` | Publish a package to npm registry |
| `version` | Bump package version (patch/minor/major) |
| `view` | View package info from registry |
| `search` | Search npm registry |
| `unpublish` | Remove a package version |
| `deprecate` | Deprecate a version |
| `owner` | Manage package owners (ls/add/rm) |
| `dist-tag` | Manage distribution tags (ls/add/rm) |
| `pack` | Preview what would be published |
| `whoami` | Check current authenticated user |
| `init` | Initialize a new package.json |
| `audit` | Run security audit |

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

## Auth

| Method | How |
|--------|-----|
| **NPM_TOKEN** (recommended) | Set `NPM_TOKEN` env var in MCP config. Get token from npmjs.com > Access Tokens |
| **npm login** | Run `npm login` in terminal first. Token saved in `~/.npmrc` is used automatically |

For 2FA-enabled accounts, pass `otp` parameter to publish/unpublish/deprecate/owner tools.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NPM_TOKEN` | -- | npm authentication token |
| `NPM_PATH` | `npm` | Path to npm binary (if not in PATH) |

## License

MIT
