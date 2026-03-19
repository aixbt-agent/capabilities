# aixbt-agent/tools

Agent-editable data providers and runnable tools.

Repo layout:

- `providers/` - import-only source adapters
- `tools/` - runnable `forge run` entrypoints

Conventions:

- only files in `tools/` map directly to `forge run <tool>`
- each runnable tool exports a `default` async function
- providers export named functions/types for reuse
- tools and providers may both be re-exported from `index.ts`
- deterministic cron jobs should prefer `forge run <tool>` over raw node/tsx script paths
