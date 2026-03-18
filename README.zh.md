[English](README.md) | [한국어](README.ko.md) | **中文** | [日本語](README.ja.md)

# npm-mcp

[![npm version](https://img.shields.io/npm/v/@mikusnuz%2Fnpm-mcp)](https://www.npmjs.com/package/@mikusnuz/npm-mcp)
[![MCP Badge](https://lobehub.com/badge/mcp/mikusnuz-npm-mcp)](https://lobehub.com/mcp/mikusnuz-npm-mcp)

MCP 服务器，让 AI 助手能够管理 npm 包。发布、版本管理、搜索、审计、安装等——通过 Claude Code 或任何 MCP 客户端完成所有操作。

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

### 发布 & 版本管理

| 工具 | 描述 |
|------|-------------|
| `publish` | 将包发布到 npm 仓库 |
| `version` | 升级包版本（patch/minor/major/pre*） |
| `unpublish` | 移除包版本 |
| `deprecate` | 弃用某个版本（空消息可取消弃用） |
| `pack` | 预览将要发布的内容 |

### 包信息

| 工具 | 描述 |
|------|-------------|
| `view` | 从仓库查看包信息 |
| `search` | 搜索 npm 仓库 |
| `bugs` | 获取包的问题跟踪器 URL |
| `repo` | 获取包的仓库 URL |
| `docs` | 获取包的文档 URL |
| `diff` | 显示包版本之间的差异 |

### 依赖管理

| 工具 | 描述 |
|------|-------------|
| `install` | 安装包 |
| `uninstall` | 移除包 |
| `update` | 将包更新到最新的 semver 兼容版本 |
| `outdated` | 检查过时的包 |
| `ls` | 列出已安装的包 |
| `explain` | 解释为什么安装了某个包 |
| `dedupe` | 减少依赖树中的重复 |
| `prune` | 移除多余的包 |
| `fund` | 显示依赖的赞助信息 |
| `query` | 使用 CSS 风格选择器查询包 |

### 安全 & 诊断

| 工具 | 描述 |
|------|-------------|
| `audit` | 运行安全审计（支持自动修复） |
| `sbom` | 生成软件物料清单（CycloneDX/SPDX） |
| `doctor` | 检查 npm 环境健康状况 |
| `ping` | 检查仓库连接 |

### 配置 & 认证

| 工具 | 描述 |
|------|-------------|
| `whoami` | 查看当前已认证的用户 |
| `token` | 管理访问令牌（list/revoke） |
| `access` | 设置或查看包的访问级别 |
| `owner` | 管理包所有者（ls/add/rm） |
| `dist-tag` | 管理分发标签（ls/add/rm） |
| `profile` | 查看或修改 npm 个人资料设置 |
| `config` | 查看 npm 配置（只读） |

### 项目设置

| 工具 | 描述 |
|------|-------------|
| `init` | 初始化新的 package.json |
| `pkg` | 以编程方式管理 package.json 字段 |
| `ci` | 从锁定文件进行干净安装（CI 用） |
| `run-script` | 运行 package.json 中定义的脚本 |
| `link` | 为开发创建本地包符号链接 |
| `cache` | 管理 npm 缓存 |

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

**安装包：**
```
install({ path: "/home/user/my-app", packages: ["express", "cors"], saveDev: false })
```

**检查过时的依赖：**
```
outdated({ path: "/home/user/my-app" })
```

**比较版本：**
```
diff({ specs: ["lodash@4.17.20", "lodash@4.17.21"] })
```

**生成 SBOM：**
```
sbom({ path: "/home/user/my-app", format: "spdx", production: true })
```

**查询依赖：**
```
query({ path: "/home/user/my-app", selector: ":root > .prod" })
```

## 认证

| 方法 | 如何使用 |
|--------|-----|
| **NPM_TOKEN**（推荐） | 在 MCP 配置中设置 `NPM_TOKEN` 环境变量。从 npmjs.com > Access Tokens 获取 token |
| **npm login** | 先在终端运行 `npm login`。保存在 `~/.npmrc` 中的 token 会被自动使用 |

对于启用了 2FA 的账户，需要在 publish/unpublish/deprecate/owner/access/token 工具中传递 `otp` 参数。

## 环境变量

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `NPM_TOKEN` | -- | npm 认证 token |
| `NPM_PATH` | `npm` | npm 二进制文件路径（如果不在 PATH 中） |

## 许可证

MIT
