# npm MCP

This project uses the `npm-mcp` MCP server for npm registry operations.

## Available Tools

Use these MCP tools instead of running npm CLI commands directly:

### Publishing & Versioning
- `mcp__npm-mcp__publish` — Publish a package. Params: `path`, `access` (public/restricted), `tag`, `otp`.
- `mcp__npm-mcp__version` — Bump version. Params: `path`, `bump` (patch/minor/major/prepatch/preminor/premajor/prerelease).
- `mcp__npm-mcp__unpublish` — Remove a package version. Params: `package`, `otp`.
- `mcp__npm-mcp__deprecate` — Deprecate a version. Params: `package`, `message`, `otp`.
- `mcp__npm-mcp__pack` — Preview what would be published. Params: `path`, `dryRun`.

### Package Info
- `mcp__npm-mcp__view` — View package info. Params: `package`, `field`.
- `mcp__npm-mcp__search` — Search npm registry. Params: `query`, `limit`.

### Dependency Management
- `mcp__npm-mcp__install` — Install packages. Params: `path`, `packages`, `saveDev`, `global`.
- `mcp__npm-mcp__uninstall` — Remove packages. Params: `path`, `packages`.
- `mcp__npm-mcp__update` — Update packages. Params: `path`, `packages`.
- `mcp__npm-mcp__outdated` — Check for outdated packages. Params: `path`.
- `mcp__npm-mcp__audit` — Run security audit. Params: `path`, `fix`, `production`.

### Configuration & Auth
- `mcp__npm-mcp__whoami` — Check current authenticated user.
- `mcp__npm-mcp__owner` — Manage package owners (ls/add/rm). Params: `subcommand`, `package`, `user`.
- `mcp__npm-mcp__dist-tag` — Manage distribution tags. Params: `subcommand`, `package`, `tag`, `version`.
- `mcp__npm-mcp__init` — Initialize a new package.json. Params: `path`, `scope`.

## When to Use

- Publishing a package to npm → `publish` with `access: "public"` for scoped packages
- Bumping version before release → `version` then `publish`
- Checking for outdated dependencies → `outdated`
- Running a security audit → `audit`, optionally with `fix: true`
- Searching npm for libraries → `search`
- Checking package ownership → `owner` with `subcommand: "ls"`
- Viewing package download stats or metadata → `view`
- Previewing package contents before publish → `pack` with `dryRun: true`

## Notes

- For 2FA-enabled accounts, pass the `otp` parameter to publish/unpublish/deprecate/owner/access/token tools.
- Always use `access: "public"` when publishing scoped packages for the first time.
- Use `pack` with `dryRun: true` to verify package contents before publishing.
