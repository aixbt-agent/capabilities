# aixbt-agent/tools

Agent-editable data providers and runnable tools. All `.ts` files live at the repo root.

Tool conventions:

- filename maps directly to `forge run <tool>`
- each runnable tool exports a `default` async function
- tools may also expose named exports for app/runtime reuse
- deterministic cron jobs should prefer `forge run <tool>` over raw node/tsx script paths
