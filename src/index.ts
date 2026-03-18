#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const exec = promisify(execFile);

const NPM = process.env.NPM_PATH || "npm";
const NPM_TOKEN = process.env.NPM_TOKEN || "";

// Create temp .npmrc when NPM_TOKEN is provided
let npmrcArgs: string[] = [];
if (NPM_TOKEN) {
  const tmp = mkdtempSync(join(tmpdir(), "npm-mcp-"));
  const npmrcPath = join(tmp, ".npmrc");
  writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n`);
  npmrcArgs = ["--userconfig", npmrcPath];
}

async function run(
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> {
  const fullArgs = [...args, ...npmrcArgs];
  const opts: { cwd?: string; timeout: number; env: NodeJS.ProcessEnv; maxBuffer: number } = {
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    env: { ...process.env, NO_COLOR: "1" },
  };
  if (cwd) opts.cwd = cwd;
  return exec(NPM, fullArgs, opts);
}

const server = new McpServer({
  name: "npm-mcp",
  version: "1.2.0",
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
    message: z.string().describe("Deprecation message (empty string to undeprecate)"),
    otp: z.string().optional().describe("One-time password for 2FA"),
  },
  async ({ package: pkg, message, otp }) => {
    const args = ["deprecate", pkg, message];
    if (otp) args.push("--otp", otp);
    try {
      const { stdout, stderr } = await run(args);
      return {
        content: [{ type: "text", text: stdout + stderr || (message ? "Deprecated successfully" : "Undeprecated successfully") }],
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
    level: z
      .enum(["info", "low", "moderate", "high", "critical"])
      .optional()
      .describe("Minimum vulnerability level to report"),
    production: z.boolean().optional().describe("Only audit production dependencies"),
  },
  async ({ path, fix, level, production }) => {
    const args = fix ? ["audit", "fix"] : ["audit"];
    args.push("--json");
    if (level) args.push("--audit-level", level);
    if (production) args.push("--omit=dev");
    try {
      const { stdout } = await run(args, path);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      // npm audit exits non-zero when vulnerabilities found
      return { content: [{ type: "text", text: e.stdout || e.stderr || e.message }] };
    }
  },
);

// ── npm outdated ──
server.tool(
  "outdated",
  "Check for outdated packages in a project",
  {
    path: z.string().describe("Absolute path to the package directory"),
    global: z.boolean().optional().describe("Check global packages"),
    long: z.boolean().optional().describe("Show extended information"),
  },
  async ({ path, global: isGlobal, long }) => {
    const args = ["outdated", "--json"];
    if (isGlobal) args.push("-g");
    if (long) args.push("--long");
    try {
      const { stdout } = await run(args, path);
      return { content: [{ type: "text", text: stdout || "{}" }] };
    } catch (e: any) {
      // npm outdated exits non-zero when outdated packages found
      return { content: [{ type: "text", text: e.stdout || e.stderr || e.message }] };
    }
  },
);

// ── npm ls ──
server.tool(
  "ls",
  "List installed packages in a project",
  {
    path: z.string().describe("Absolute path to the package directory"),
    package: z.string().optional().describe("Specific package to look for"),
    depth: z.number().optional().describe("Dependency tree depth (default: 0)"),
    all: z.boolean().optional().describe("Show all packages, not just top-level"),
    global: z.boolean().optional().describe("List global packages"),
    production: z.boolean().optional().describe("Only show production dependencies"),
  },
  async ({ path, package: pkg, depth, all, global: isGlobal, production }) => {
    const args = ["ls", "--json"];
    if (pkg) args.push(pkg);
    if (depth !== undefined) args.push("--depth", String(depth));
    if (all) args.push("--all");
    if (isGlobal) args.push("-g");
    if (production) args.push("--omit=dev");
    try {
      const { stdout } = await run(args, path);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e: any) {
      // npm ls exits non-zero when there are missing/extraneous packages
      return { content: [{ type: "text", text: e.stdout || e.stderr || e.message }] };
    }
  },
);

// ── npm install ──
server.tool(
  "install",
  "Install packages in a project",
  {
    path: z.string().describe("Absolute path to the package directory"),
    packages: z.array(z.string()).optional().describe("Package names to install (empty = install all from package.json)"),
    saveDev: z.boolean().optional().describe("Save as devDependency"),
    saveExact: z.boolean().optional().describe("Save exact version instead of semver range"),
    global: z.boolean().optional().describe("Install globally"),
    dryRun: z.boolean().optional().describe("Preview install without making changes"),
  },
  async ({ path, packages, saveDev, saveExact, global: isGlobal, dryRun }) => {
    const args = ["install"];
    if (packages && packages.length > 0) args.push(...packages);
    if (saveDev) args.push("--save-dev");
    if (saveExact) args.push("--save-exact");
    if (isGlobal) args.push("-g");
    if (dryRun) args.push("--dry-run");
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

// ── npm uninstall ──
server.tool(
  "uninstall",
  "Remove packages from a project",
  {
    path: z.string().describe("Absolute path to the package directory"),
    packages: z.array(z.string()).describe("Package names to uninstall"),
    global: z.boolean().optional().describe("Uninstall from global"),
  },
  async ({ path, packages, global: isGlobal }) => {
    const args = ["uninstall", ...packages];
    if (isGlobal) args.push("-g");
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

// ── npm update ──
server.tool(
  "update",
  "Update packages in a project to their latest semver-compatible version",
  {
    path: z.string().describe("Absolute path to the package directory"),
    packages: z.array(z.string()).optional().describe("Specific packages to update (empty = update all)"),
    global: z.boolean().optional().describe("Update global packages"),
    dryRun: z.boolean().optional().describe("Preview updates without making changes"),
  },
  async ({ path, packages, global: isGlobal, dryRun }) => {
    const args = ["update"];
    if (packages && packages.length > 0) args.push(...packages);
    if (isGlobal) args.push("-g");
    if (dryRun) args.push("--dry-run");
    try {
      const { stdout, stderr } = await run(args, path);
      return { content: [{ type: "text", text: stdout + stderr || "Update complete" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm access ──
server.tool(
  "access",
  "Set or view access level on published packages",
  {
    action: z.enum(["list", "get", "set", "grant", "revoke"]).describe("Action to perform"),
    package: z.string().optional().describe("Package name"),
    level: z
      .enum(["public", "restricted"])
      .optional()
      .describe("Access level (for set action)"),
    team: z.string().optional().describe("Team name in org:team format (for grant/revoke)"),
    permission: z
      .enum(["read-only", "read-write"])
      .optional()
      .describe("Permission level (for grant action)"),
    otp: z.string().optional().describe("One-time password for 2FA"),
  },
  async ({ action, package: pkg, level, team, permission, otp }) => {
    const args = ["access"];
    switch (action) {
      case "list":
        args.push("list", "packages");
        if (pkg) args.push(pkg);
        break;
      case "get":
        args.push("get", "status");
        if (pkg) args.push(pkg);
        break;
      case "set":
        if (level === "public") args.push("public");
        else args.push("restricted");
        if (pkg) args.push(pkg);
        break;
      case "grant":
        args.push("grant", permission || "read-only");
        if (team) args.push(team);
        if (pkg) args.push(pkg);
        break;
      case "revoke":
        args.push("revoke");
        if (team) args.push(team);
        if (pkg) args.push(pkg);
        break;
    }
    if (otp) args.push("--otp", otp);
    try {
      const { stdout } = await run(args);
      return { content: [{ type: "text", text: stdout || "Done" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm token ──
server.tool(
  "token",
  "Manage npm access tokens (list or revoke)",
  {
    action: z.enum(["list", "revoke"]).describe("Action to perform"),
    token: z.string().optional().describe("Token ID to revoke (required for revoke)"),
    otp: z.string().optional().describe("One-time password for 2FA"),
  },
  async ({ action, token, otp }) => {
    const args = ["token"];
    if (action === "list") {
      args.push("list", "--json");
    } else if (action === "revoke") {
      if (!token) {
        return {
          content: [{ type: "text", text: "Error: token ID is required for revoke action" }],
          isError: true,
        };
      }
      args.push("revoke", token);
    }
    if (otp) args.push("--otp", otp);
    try {
      const { stdout, stderr } = await run(args);
      return { content: [{ type: "text", text: stdout + stderr || "Done" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm ping ──
server.tool(
  "ping",
  "Check connectivity to the npm registry",
  {},
  async () => {
    try {
      const { stdout, stderr } = await run(["ping"]);
      return { content: [{ type: "text", text: stdout + stderr || "Registry is reachable" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm bugs ──
server.tool(
  "bugs",
  "Get the bug tracker URL for a package",
  {
    package: z.string().describe("Package name"),
  },
  async ({ package: pkg }) => {
    // Use --no-browser to just print the URL without opening it
    const args = ["bugs", pkg, "--no-browser"];
    try {
      const { stdout, stderr } = await run(args);
      return { content: [{ type: "text", text: (stdout + stderr).trim() }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm repo ──
server.tool(
  "repo",
  "Get the repository URL for a package",
  {
    package: z.string().describe("Package name"),
  },
  async ({ package: pkg }) => {
    const args = ["repo", pkg, "--no-browser"];
    try {
      const { stdout, stderr } = await run(args);
      return { content: [{ type: "text", text: (stdout + stderr).trim() }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm docs ──
server.tool(
  "docs",
  "Get the documentation URL for a package",
  {
    package: z.string().describe("Package name"),
  },
  async ({ package: pkg }) => {
    const args = ["docs", pkg, "--no-browser"];
    try {
      const { stdout, stderr } = await run(args);
      return { content: [{ type: "text", text: (stdout + stderr).trim() }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm diff ──
server.tool(
  "diff",
  "Show diff between package versions or between local and registry",
  {
    package: z.string().optional().describe("Package spec for comparison (e.g. pkg@1.0.0..pkg@2.0.0)"),
    specs: z.array(z.string()).optional().describe("Two package specs to compare (e.g. ['pkg@1.0.0', 'pkg@2.0.0'])"),
    path: z.string().optional().describe("Absolute path to local package (compares local vs registry)"),
    diffNameOnly: z.boolean().optional().describe("Only show file names that changed"),
  },
  async ({ package: pkg, specs, path, diffNameOnly }) => {
    const args = ["diff"];
    if (specs && specs.length > 0) {
      for (const s of specs) args.push(`--diff=${s}`);
    } else if (pkg) {
      args.push(`--diff=${pkg}`);
    }
    if (diffNameOnly) args.push("--diff-name-only");
    try {
      const { stdout } = await run(args, path);
      return { content: [{ type: "text", text: stdout || "No differences found" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm pkg ──
server.tool(
  "pkg",
  "Manage package.json fields programmatically",
  {
    path: z.string().describe("Absolute path to the package directory"),
    action: z.enum(["get", "set", "delete"]).describe("Action to perform"),
    field: z.string().describe("Field name (e.g. 'name', 'scripts.build', 'keywords')"),
    value: z.string().optional().describe("Value to set (required for set action, use JSON for objects/arrays)"),
  },
  async ({ path, action, field, value }) => {
    const args = ["pkg", action, field];
    if (action === "set" && value !== undefined) {
      args.push(value);
    }
    args.push("--json");
    try {
      const { stdout, stderr } = await run(args, path);
      return { content: [{ type: "text", text: stdout + stderr || "Done" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm fund ──
server.tool(
  "fund",
  "Show funding information for installed packages",
  {
    path: z.string().describe("Absolute path to the package directory"),
    package: z.string().optional().describe("Specific package to check"),
  },
  async ({ path, package: pkg }) => {
    const args = ["fund", "--json"];
    if (pkg) args.push(pkg);
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

// ── npm dedupe ──
server.tool(
  "dedupe",
  "Reduce duplication in the dependency tree",
  {
    path: z.string().describe("Absolute path to the package directory"),
    dryRun: z.boolean().optional().describe("Preview changes without making them"),
  },
  async ({ path, dryRun }) => {
    const args = ["dedupe"];
    if (dryRun) args.push("--dry-run");
    try {
      const { stdout, stderr } = await run(args, path);
      return { content: [{ type: "text", text: stdout + stderr || "Deduplication complete" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm explain ──
server.tool(
  "explain",
  "Explain why a package is installed (show dependency chain)",
  {
    path: z.string().describe("Absolute path to the package directory"),
    package: z.string().describe("Package name to explain"),
  },
  async ({ path, package: pkg }) => {
    const args = ["explain", pkg, "--json"];
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

// ── npm sbom ──
server.tool(
  "sbom",
  "Generate a Software Bill of Materials (SBOM) for a project",
  {
    path: z.string().describe("Absolute path to the package directory"),
    format: z
      .enum(["cyclonedx", "spdx"])
      .optional()
      .describe("SBOM format (default: cyclonedx)"),
    production: z.boolean().optional().describe("Only include production dependencies"),
  },
  async ({ path, format, production }) => {
    const args = ["sbom"];
    if (format) args.push(`--sbom-format=${format}`);
    if (production) args.push("--omit=dev");
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

// ── npm profile ──
server.tool(
  "profile",
  "View or modify npm user profile settings",
  {
    action: z.enum(["get", "set"]).describe("Action to perform"),
    field: z.string().optional().describe("Profile field to get or set (e.g. email, fullname, homepage)"),
    value: z.string().optional().describe("Value to set (required for set action)"),
    otp: z.string().optional().describe("One-time password for 2FA"),
  },
  async ({ action, field, value, otp }) => {
    const args = ["profile", action];
    if (field) args.push(field);
    if (action === "set" && value) args.push(value);
    if (action === "get") args.push("--json");
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

// ── npm ci ──
server.tool(
  "ci",
  "Clean install dependencies from lockfile (for CI environments)",
  {
    path: z.string().describe("Absolute path to the package directory"),
  },
  async ({ path }) => {
    const args = ["ci"];
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

// ── npm run ──
server.tool(
  "run-script",
  "Run a script defined in package.json",
  {
    path: z.string().describe("Absolute path to the package directory"),
    script: z.string().optional().describe("Script name to run (omit to list available scripts)"),
    args: z.array(z.string()).optional().describe("Arguments to pass to the script"),
  },
  async ({ path, script, args: scriptArgs }) => {
    const cmdArgs = script ? ["run", script] : ["run"];
    if (scriptArgs && scriptArgs.length > 0) {
      cmdArgs.push("--");
      cmdArgs.push(...scriptArgs);
    }
    if (!script) cmdArgs.push("--json");
    try {
      const { stdout, stderr } = await run(cmdArgs, path);
      return { content: [{ type: "text", text: stdout + stderr }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stdout || ""}${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm doctor ──
server.tool(
  "doctor",
  "Run diagnostics to check npm environment health",
  {},
  async () => {
    try {
      const { stdout, stderr } = await run(["doctor"]);
      return { content: [{ type: "text", text: stdout + stderr }] };
    } catch (e: any) {
      // doctor may exit non-zero if checks fail
      return { content: [{ type: "text", text: e.stdout || e.stderr || e.message }] };
    }
  },
);

// ── npm cache ──
server.tool(
  "cache",
  "Manage the npm cache",
  {
    action: z.enum(["clean", "verify", "ls"]).describe("Action: clean (clear cache), verify (check integrity), ls (list contents)"),
    force: z.boolean().optional().describe("Force clean (required for clean action)"),
  },
  async ({ action, force }) => {
    const args = ["cache", action];
    if (action === "clean" && force) args.push("--force");
    try {
      const { stdout, stderr } = await run(args);
      return { content: [{ type: "text", text: stdout + stderr || "Done" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm config ──
server.tool(
  "config",
  "View npm configuration (read-only for safety)",
  {
    action: z.enum(["list", "get"]).describe("Action: list (show all config), get (get specific key)"),
    key: z.string().optional().describe("Config key to get (required for get action)"),
  },
  async ({ action, key }) => {
    const args = ["config", action];
    if (action === "get" && key) args.push(key);
    if (action === "list") args.push("--json");
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

// ── npm prune ──
server.tool(
  "prune",
  "Remove extraneous packages not listed in package.json",
  {
    path: z.string().describe("Absolute path to the package directory"),
    production: z.boolean().optional().describe("Remove devDependencies"),
    dryRun: z.boolean().optional().describe("Preview changes without making them"),
  },
  async ({ path, production, dryRun }) => {
    const args = ["prune"];
    if (production) args.push("--omit=dev");
    if (dryRun) args.push("--dry-run");
    try {
      const { stdout, stderr } = await run(args, path);
      return { content: [{ type: "text", text: stdout + stderr || "Prune complete" }] };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error: ${e.stderr || e.message}` }],
        isError: true,
      };
    }
  },
);

// ── npm link ──
server.tool(
  "link",
  "Symlink a local package for development",
  {
    path: z.string().describe("Absolute path to the package directory"),
    package: z.string().optional().describe("Package name to link (omit to link current dir globally)"),
  },
  async ({ path, package: pkg }) => {
    const args = ["link"];
    if (pkg) args.push(pkg);
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

// ── npm query ──
server.tool(
  "query",
  "Query installed packages using CSS-like selectors",
  {
    path: z.string().describe("Absolute path to the package directory"),
    selector: z.string().describe("CSS-like dependency selector (e.g. ':root > .prod', '.dev', '#lodash')"),
  },
  async ({ path, selector }) => {
    const args = ["query", selector];
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

// ── Resources ──

server.resource(
  "npm-whoami",
  "npm://whoami",
  {
    description: "Current authenticated npm user",
    mimeType: "application/json",
  },
  async () => {
    try {
      const { stdout } = await run(["whoami"]);
      const result = JSON.stringify({ username: stdout.trim(), authenticated: true });
      return {
        contents: [{ uri: "npm://whoami", mimeType: "application/json", text: result }],
      };
    } catch (e: any) {
      const result = JSON.stringify({
        authenticated: false,
        error: NPM_TOKEN ? "Token is set but invalid." : "No NPM_TOKEN set.",
      });
      return {
        contents: [{ uri: "npm://whoami", mimeType: "application/json", text: result }],
      };
    }
  },
);

server.resource(
  "npm-package",
  new ResourceTemplate("npm://package/{name}", { list: undefined }),
  {
    description: "Package metadata from the npm registry",
    mimeType: "application/json",
  },
  async (uri: URL, variables: Record<string, string | string[]>) => {
    const nameVar = variables["name"];
    const name = (Array.isArray(nameVar) ? nameVar[0] : nameVar) ?? uri.pathname.replace(/^\/package\//, "");
    try {
      const { stdout } = await run(["view", name, "--json"]);
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: stdout }],
      };
    } catch (e: any) {
      const result = JSON.stringify({ error: (e as any).stderr || (e as Error).message });
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: result }],
      };
    }
  },
);

// ── Prompts ──

server.prompt(
  "publish_package",
  "Guide through publishing a new npm package version: version bump, build, pack preview, publish, and git tag",
  {
    path: z.string().describe("Absolute path to the package directory"),
    bump: z
      .enum(["patch", "minor", "major"])
      .optional()
      .describe("Version bump type (default: patch)"),
    access: z
      .enum(["public", "restricted"])
      .optional()
      .describe("Access level for scoped packages (default: public)"),
  },
  ({ path, bump, access }) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Please help me publish the npm package at \`${path}\`.

Follow these steps in order:

1. **Check auth** — call \`whoami\` to confirm we are logged in.
2. **Preview contents** — call \`pack\` with \`dryRun: true\` to review what will be included.
3. **Bump version** — call \`version\` with bump="${bump ?? "patch"}" and \`noGitTag: false\` so a git tag is created automatically.
4. **Publish** — call \`publish\` with access="${access ?? "public"}". If the account has 2FA enabled, ask me for the OTP first.
5. **Confirm** — call \`view\` on the package to confirm the new version is live on the registry.

Report the final published version and registry URL when done.`,
        },
      },
    ],
  }),
);

server.prompt(
  "audit_package",
  "Audit a package: check vulnerabilities, outdated dependencies, and download stats",
  {
    path: z.string().describe("Absolute path to the package directory"),
    packageName: z.string().describe("Package name as published on npm (e.g. @scope/pkg)"),
  },
  ({ path, packageName }) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Please run a full audit of the npm package \`${packageName}\` located at \`${path}\`.

Perform these checks in order:

1. **Security audit** — call \`audit\` on \`${path}\`. Summarise any vulnerabilities by severity (critical / high / moderate / low).
2. **Outdated check** — call \`outdated\` on \`${path}\` to see which dependencies need updating.
3. **Registry metadata** — call \`view\` on \`${packageName}\` with field="dist-tags" to see which versions are tagged, then with field="time" to see publish history.
4. **Owners** — call \`owner\` with action="ls" on \`${packageName}\` to list current maintainers.

At the end, provide a summary with:
- Number and severity of vulnerabilities found
- List of outdated dependencies with current vs latest versions
- Latest published version and date
- List of maintainers
- Any recommended actions`,
        },
      },
    ],
  }),
);

server.prompt(
  "dependency_health",
  "Comprehensive dependency health check: outdated, audit, explain, and cleanup recommendations",
  {
    path: z.string().describe("Absolute path to the package directory"),
  },
  ({ path }) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Please run a comprehensive dependency health check on the project at \`${path}\`.

Perform these checks in order:

1. **List dependencies** — call \`ls\` with depth=0 to see direct dependencies.
2. **Check outdated** — call \`outdated\` to find packages that need updating.
3. **Security audit** — call \`audit\` to find vulnerabilities.
4. **Check for duplicates** — call \`dedupe\` with dryRun=true to see if deduplication would help.

At the end, provide a summary with:
- Total number of direct dependencies (prod vs dev)
- Number of outdated packages with recommended update strategy
- Security vulnerabilities by severity
- Recommendations for cleanup and optimization`,
        },
      },
    ],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
