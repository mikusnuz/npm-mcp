[English](README.md) | [한국어](README.ko.md) | **中文** | [日本語](README.ja.md)

# npm-mcp

MCP 服务器，让 AI 助手能够管理 npm 包。发布、版本管理、搜索、审计——通过 Claude Code 或任何 MCP 客户端完成所有操作。

## 为什么需要它

你在 Claude Code 中构建一个库。完成代码后，现在需要发布它。无需切换到终端：

```
你：将此包发布到 npm，使用公开访问权限
Claude：[调用发布工具] 成功发布 @yourorg/lib@1.0.0
```

就是这样。无需切换上下文。

## 设置

### 1. 安装

```bash
git clone https://github.com/mikusnuz/npm-mcp.git
cd npm-mcp
npm install
npm run build
```

### 2. 获取 npm token

访问 [npmjs.com](https://www.npmjs.com) > Account > Access Tokens > **Generate New Token**（推荐使用 Automation 类型）。

### 3. 添加到 Claude Code

编辑 `~/.claude/settings.json`：

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

或者，如果你已经在本地运行过 `npm login`，可以跳过 `NPM_TOKEN` —— 它会自动使用你的 `~/.npmrc`。

## 工具

| 工具 | 描述 |
|------|-------------|
| `publish` | 将包发布到 npm 仓库 |
| `version` | 升级包版本（patch/minor/major） |
| `view` | 从仓库查看包信息 |
| `search` | 搜索 npm 仓库 |
| `unpublish` | 移除包版本 |
| `deprecate` | 弃用某个版本 |
| `owner` | 管理包所有者（ls/add/rm） |
| `dist-tag` | 管理分发标签（ls/add/rm） |
| `pack` | 预览将要发布的内容 |
| `whoami` | 查看当前已认证的用户 |
| `init` | 初始化新的 package.json |
| `audit` | 运行安全审计 |

## 示例

**发布 scoped 包：**
```
publish({ path: "/home/user/my-lib", access: "public" })
```

**升级版本并发布：**
```
version({ path: "/home/user/my-lib", bump: "patch" })
publish({ path: "/home/user/my-lib" })
```

**发布前检查包内容：**
```
pack({ path: "/home/user/my-lib", dryRun: true })
```

**搜索现有包：**
```
search({ query: "react state management", limit: 5 })
```

**查看包详细信息：**
```
view({ package: "@yourorg/lib", field: "versions" })
```

## 认证

| 方法 | 如何使用 |
|--------|-----|
| **NPM_TOKEN**（推荐） | 在 MCP 配置中设置 `NPM_TOKEN` 环境变量。从 npmjs.com > Access Tokens 获取 token |
| **npm login** | 先在终端运行 `npm login`。保存在 `~/.npmrc` 中的 token 会被自动使用 |

对于启用了 2FA 的账户，需要在 publish/unpublish/deprecate/owner 工具中传递 `otp` 参数。

## 环境变量

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `NPM_TOKEN` | -- | npm 认证 token |
| `NPM_PATH` | `npm` | npm 二进制文件路径（如果不在 PATH 中） |

## 许可证

MIT
