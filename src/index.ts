#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

const NPM = process.env.NPM_PATH || "npm";
const NPM_TOKEN = process.env.NPM_TOKEN || "";

async function run(
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> {
  const env: NodeJS.ProcessEnv = { ...process.env, NO_COLOR: "1" };

  // NPM_TOKEN이 설정되어 있으면 npm config로 인증 주입
  if (NPM_TOKEN) {
    env.npm_config__authToken = NPM_TOKEN;
  }

  const opts: { cwd?: string; timeout: number; env: NodeJS.ProcessEnv } = {
    timeout: 120_000,
    env,
  };
  if (cwd) opts.cwd = cwd;
  return exec(NPM, args, opts);
}

const server = new McpServer({
  name: "npm-mcp",
  version: "1.0.0",
});

// ── npm publish ──
server.tool(
  "publish",
  "Publish a package to the npm registry",
  {
    path: z.string().describe("Absolute path to the package directory"),
    tag: z.string().optional().describe("Dist-tag (default: latest)"),
    access: z
      .enum(["public", "restricted"])
      .optional()
      .describe("Access level for scoped packages"),
    dryRun: z
      .boolean()
      .optional()
      .describe("Run publish without actually publishing"),
    otp: z.string().optional().describe("One-time password for 2FA"),
  },
  async ({ path, tag, access, dryRun, otp }) => {
    const args = ["publish"];
    if (tag) args.push("--tag", tag);
    if (access) args.push("--access", access);
    if (dryRun) args.push("--dry-run");
    if (otp) args.push("--otp", otp);
    try {
      const { stdout, stderr } = await run(args, path);
      return { content: [{ type: "text", text: stdout + stderr }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm version ──
server.tool(
  "version",
  "Bump the package version",
  {
    path: z.string().describe("Absolute path to the package directory"),
    bump: z
      .enum(["patch", "minor", "major", "prepatch", "preminor", "premajor", "prerelease"])
      .describe("Version bump type"),
    preid: z.string().optional().describe("Prerelease identifier (e.g. alpha, beta)"),
    noGitTag: z.boolean().optional().describe("Skip git tag creation"),
  },
  async ({ path, bump, preid, noGitTag }) => {
    const args = ["version", bump];
    if (preid) args.push("--preid", preid);
    if (noGitTag) args.push("--no-git-tag-version");
    try {
      const { stdout } = await run(args, path);
      return { content: [{ type: "text", text: stdout.trim() }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm view ──
server.tool(
  "view",
  "View package information from the registry",
  {
    package: z.string().describe("Package name (e.g. react, @scope/pkg)"),
    field: z.string().optional().describe("Specific field to view (e.g. versions, dist-tags)"),
  },
  async ({ package: pkg, field }) => {
    const args = ["view", pkg];
    if (field) args.push(field);
    args.push("--json");
    try {
      const { stdout } = await run(args);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm search ──
server.tool(
  "search",
  "Search npm registry for packages",
  {
    query: z.string().describe("Search query"),
    limit: z.number().optional().describe("Max results (default 20)"),
  },
  async ({ query, limit }) => {
    const args = ["search", query, "--json"];
    if (limit) args.push("--limit", String(limit));
    try {
      const { stdout } = await run(args);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm unpublish ──
server.tool(
  "unpublish",
  "Remove a package version from the registry",
  {
    package: z.string().describe("Package name with optional version (e.g. pkg@1.0.0)"),
    force: z.boolean().optional().describe("Force unpublish (required for entire package)"),
    otp: z.string().optional().describe("One-time password for 2FA"),
  },
  async ({ package: pkg, force, otp }) => {
    const args = ["unpublish", pkg];
    if (force) args.push("--force");
    if (otp) args.push("--otp", otp);
    try {
      const { stdout, stderr } = await run(args);
      return { content: [{ type: "text", text: stdout + stderr }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm deprecate ──
server.tool(
  "deprecate",
  "Deprecate a version of a package",
  {
    package: z.string().describe("Package@version range (e.g. pkg@<1.0.0)"),
    message: z.string().describe("Deprecation message"),
    otp: z.string().optional().describe("One-time password for 2FA"),
  },
  async ({ package: pkg, message, otp }) => {
    const args = ["deprecate", pkg, message];
    if (otp) args.push("--otp", otp);
    try {
      const { stdout, stderr } = await run(args);
      return {
        content: [{ type: "text", text: stdout + stderr || "Deprecated successfully" }],
      };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm owner ──
server.tool(
  "owner",
  "Manage package owners",
  {
    action: z.enum(["ls", "add", "rm"]).describe("Action to perform"),
    package: z.string().describe("Package name"),
    user: z.string().optional().describe("Username (required for add/rm)"),
    otp: z.string().optional().describe("One-time password for 2FA"),
  },
  async ({ action, package: pkg, user, otp }) => {
    const args = ["owner", action, pkg];
    if (user && (action === "add" || action === "rm")) args.push(user);
    if (otp) args.push("--otp", otp);
    try {
      const { stdout } = await run(args);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm dist-tag ──
server.tool(
  "dist-tag",
  "Manage distribution tags",
  {
    action: z.enum(["ls", "add", "rm"]).describe("Action to perform"),
    package: z.string().describe("Package name (for add: pkg@version)"),
    tag: z.string().optional().describe("Tag name (required for add/rm)"),
  },
  async ({ action, package: pkg, tag }) => {
    const args = ["dist-tag", action, pkg];
    if (tag && (action === "add" || action === "rm")) args.push(tag);
    try {
      const { stdout } = await run(args);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm pack ──
server.tool(
  "pack",
  "Create a tarball from a package (preview what would be published)",
  {
    path: z.string().describe("Absolute path to the package directory"),
    dryRun: z.boolean().optional().describe("List files without creating tarball"),
  },
  async ({ path, dryRun }) => {
    const args = ["pack"];
    if (dryRun) args.push("--dry-run");
    args.push("--json");
    try {
      const { stdout } = await run(args, path);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm whoami ──
server.tool(
  "whoami",
  "Check which npm user is currently authenticated. If not logged in, set NPM_TOKEN env var in MCP config.",
  {},
  async () => {
    try {
      const { stdout } = await run(["whoami"]);
      return { content: [{ type: "text", text: stdout.trim() }] };
    } catch (e: any) {
      const hint = NPM_TOKEN
        ? "Token is set but invalid."
        : "No NPM_TOKEN set. Add it to your MCP server config env, or run `npm login` first.";
      return {
        content: [{ type: "text", text: `Not logged in. ${hint}\n${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm init ──
server.tool(
  "init",
  "Initialize a new package.json",
  {
    path: z.string().describe("Absolute path to the directory"),
    scope: z.string().optional().describe("Scope for the package (e.g. @myorg)"),
  },
  async ({ path, scope }) => {
    const args = ["init", "-y"];
    if (scope) args.push("--scope", scope);
    try {
      const { stdout } = await run(args, path);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm audit ──
server.tool(
  "audit",
  "Run a security audit on the package",
  {
    path: z.string().describe("Absolute path to the package directory"),
    fix: z.boolean().optional().describe("Automatically fix vulnerabilities"),
  },
  async ({ path, fix }) => {
    const args = fix ? ["audit", "fix", "--json"] : ["audit", "--json"];
    try {
      const { stdout } = await run(args, path);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      // npm audit exits non-zero when vulnerabilities found
      return { content: [{ type: "text", text: e.stdout || e.stderr || e.message }] };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
