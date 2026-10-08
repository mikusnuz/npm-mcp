import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("MCP commands match npm owner/access/pkg and staged publishing contracts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "npm-mcp-test-"));
  const shim = join(dir, "npm-fixture");
  await writeFile(shim, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'publish' && args.includes('stage-required')) {
  process.stderr.write('E_STAGE_REQUIRED');
  process.exit(1);
}
process.stdout.write(JSON.stringify({ args, cwd: process.cwd() }));
`, { mode: 0o700 });
  const client = new Client({ name: "npm-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/index.js"],
    cwd: process.cwd(),
    env: { ...process.env, NPM_PATH: shim, NPM_TOKEN: "" },
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const call = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      assert.notEqual(result.isError, true, JSON.stringify(result));
      return JSON.parse(result.content[0].text);
    };
    for (const action of ["add", "rm"]) {
      assert.deepEqual((await call("owner", { action, package: "@scope/pkg", user: "alice", otp: "123456" })).args,
        ["owner", action, "alice", "@scope/pkg", "--otp", "123456"]);
    }
    assert.deepEqual((await call("owner", { action: "ls", package: "@scope/pkg" })).args, ["owner", "ls", "@scope/pkg"]);
    for (const level of ["public", "private", "restricted"]) {
      assert.deepEqual((await call("access", { action: "set", package: "@scope/pkg", level })).args,
        ["access", "set", `status=${level === "restricted" ? "private" : level}`, "@scope/pkg"]);
    }
    for (const value of ["a value with spaces and =", "true", true, false, 3, null, ["a", "b"], { test: "node --test" }]) {
      assert.deepEqual((await call("pkg", { action: "set", path: dir, field: "testField", value })).args,
        ["pkg", "set", `testField=${JSON.stringify(value)}`, "--json"]);
    }
    const staged = await call("stage", { action: "publish", path: dir, tag: "next", access: "public", dryRun: true });
    assert.deepEqual(staged.args, ["stage", "publish", "--tag", "next", "--access", "public", "--dry-run"]);
    assert.equal(staged.cwd, await realpath(dir));
    assert.deepEqual((await call("stage", { action: "list", package: "@scope/pkg" })).args, ["stage", "list", "@scope/pkg", "--json"]);
    for (const action of ["view", "download", "approve", "reject"]) {
      const opts = { action, stageId: "stage-123", ...(action === "download" ? { path: dir } : {}) };
      if (["approve", "reject"].includes(action)) opts.otp = "123456";
      const expected = ["stage", action, "stage-123", ...(["view", "download"].includes(action) ? ["--json"] : ["--otp", "123456"])];
      assert.deepEqual((await call("stage", opts)).args, expected);
    }
    for (const [name, args] of [
      ["owner", { action: "add", package: "pkg" }],
      ["access", { action: "set", package: "pkg" }],
      ["pkg", { action: "set", path: dir, field: "name" }],
      ["stage", { action: "publish" }],
      ["stage", { action: "approve" }],
      ["stage", { action: "download", stageId: "stage-123" }],
      ["stage", { action: "reject", stageId: "stage-123", dryRun: true }],
    ]) {
      assert.equal((await client.callTool({ name, arguments: args })).isError, true);
    }
    const required = await client.callTool({ name: "publish", arguments: { path: dir, tag: "stage-required" } });
    assert.equal(required.isError, true);
    assert.match(required.content[0].text, /Use stage with action=publish/);
  } finally {
    await client.close();
    await rm(dir, { recursive: true, force: true });
  }
});
