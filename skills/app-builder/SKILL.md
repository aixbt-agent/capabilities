---
name: app-builder
description: Build and deploy web apps with design system. Use when building, deploying, or updating apps.
triggers:
  - build app
  - deploy app
  - create app
  - update app
  - design system
---

# App Builder

## repos

- app repos: `aixbt-agent/app-<subdomain>`
- components repo: `aixbt-agent/components`
- shared UI package name: `@aixbt-agent/components`
- skills, templates, providers, tools, and shared cron or data jobs: `aixbt-agent/capabilities`

`components` is UI-only. do not put providers, tools, server helpers, or data hooks there.

## apps

deploy to `{subdomain}.aixbt.sh`.

- **static**: vite+react, reads data from the data API (`api.aixbt.sh/data/`)
- **SSR**: express `server.ts` with explicit routes for server-side logic. prefer calling platform or capability endpoints, not importing providers directly into the app repo
- **new app workflow**: `create_app_repo` → edit the managed local `app-*` repo → `run_app_preview` → `verify_app_preview` → `push_app_changes` → `deploy_app` → `verify_app_change`
- **existing app workflow**: `open_app_repo` → edit the managed local `app-*` repo → `run_app_preview` → `verify_app_preview` → `push_app_changes` → `deploy_app` → `verify_app_change`
- **capability-backed workflow**: if the app needs new shared data fetching, tools, or cross-app cron logic, edit `aixbt-agent/capabilities` first, run `deploy_capabilities_changes`, then update the app repo
- prefer editing existing apps. `api.aixbt.sh` is reserved
- use the private local preview as the main development loop. `verify_app_change` remains the final deployed check
- `deploy_app` owns the normal build step for apps with build commands. use `build_app` only for debugging or explicit local validation
- after deploying, you MUST verify the live root with `verify_app_change` and use `verify_url` only for changed or critical API/data paths. see quality gates below
- send progress updates at major steps while working: after inspection, before deploy, and before verification
- every app may declare `app.sources.json` listing the shared data source IDs it reads
- shared data sources live in `data-sources.json` at the workspace root. reuse an existing source whenever possible instead of inventing duplicate tables or jobs

### SSR apps

use SSR when an app needs server-side endpoints, request signing, or app-local orchestration. SSR apps can still read from the data API for stored analysis or signals. prefer explicit HTTP boundaries over direct provider imports.

**`app.json`**:
```json
{ "name": "My App", "type": "ssr", "buildOutput": "dist", "startCommand": "npx tsx server.ts", "port": 4003 }
```

- `port`: app-local runtime port inside the service
- `startCommand`: runs with `cwd` = app dir, `PORT` env var set, inherits all parent env vars
- each SSR app is its own Railway service behind the wildcard gateway

**`server.ts` pattern**:
- expose only the routes the app needs
- call platform or capability HTTP endpoints when shared data is required
- serve API routes with in-memory cache (10 min TTL)
- serve vite build: `express.static('dist')` + SPA fallback
- add `express` to app's `package.json` dependencies

### static apps

use static when the app only reads pre-computed data from the data API.

- **data**: use `api.aixbt.sh/data/:namespace/:table` for stored data. create tools + crons to populate it

## data sources

think in terms of what the app **reads**, not what it owns.

- **table-group**: stored tables under a namespace, read through `/api/data/:table`
- **live-endpoint**: SSR route such as `/api/prices`, `/api/rates`, `/api/surge`
- **derived**: platform/shared output that may feed multiple apps

default workflow when creating or changing an app:

1. decide whether the app is `ui-only`, `table-backed`, `live-endpoint`, or `hybrid`
2. inspect `data-sources.json` and reuse existing source IDs where possible
3. if a new source is needed, add one source definition only
4. if using stored data, read `api.aixbt.sh/data/:namespace/:table` directly or add a small inline SSR proxy route in `server.ts`
5. if using live data, expose an explicit SSR endpoint or extend a capability endpoint
6. update `app.sources.json`
7. run `explain_app_sources` or `validate_app_sources` before deploy
8. after deploy, run `verify_app_change` for the app root and use `verify_url` only for custom API/data checks that changed or are critical to the task

rules:
- do not create a cron just because an app exists
- do not create app-specific copies of shared data without a real reason
- a new app can be UI-only and have no source metadata yet
- if stored data exists, the namespace tables should be explicit and reusable
- app-only cron definitions belong with the app
- cross-app or shared cron logic belongs in `aixbt-agent/capabilities`
- do not import providers or tools directly from platform paths into an extracted app repo

## design

before styling, read `references/guide.md` and `assets/tokens.css` (paths relative to this skill folder).

follow `references/guide.md` for all visual decisions. tokens in `assets/tokens.css`. components in `assets/components.css`.

### shared React components

reusable components come from `@aixbt-agent/components`. import them from app repos like this:

```tsx
import '@aixbt-agent/components/tokens.css'
import '@aixbt-agent/components/components.css'
import { Timeline, PillButton, Panel, TabBar, SkeletonBar } from '@aixbt-agent/components'
```

shared UI stays visual: `SkeletonBar`, `Panel`, `Label`, `Tag`, `Badge`, `PillButton`, `TabBar`, `SlidePanel`, `Timeline`, `PlaybookCard`, `PriceTicker`, `ThresholdRow`, `Accordion`. keep data hooks and server helpers local to the app repo.

## quality gates

### app deployment — end-to-end verification
after every app deploy, you MUST verify the live site works. this is non-negotiable:

1. run `verify_app_change` for the deployed app root and any critical app paths
2. run `verify_url` only for custom API/data routes or specific content assertions that matter to the change
3. **verify data is real** — no fabricated, placeholder, or hallucinated data is acceptable
4. if anything is broken, fix it and redeploy. repeat until the site is fully functional
5. do NOT mark the task as complete until every required verification passes on the live URL

### data integrity
- all data displayed in apps must be verified and accurate — no hallucinated data
- never fabricate sample data, placeholder values, or mock data in production apps
- if data is missing or unavailable, surface that clearly in the UI — do not fill gaps with made-up values

## syncing

`deploy_app` is the app deploy entrypoint after preview verification and `push_app_changes`. `deploy_changes` is for platform repo changes only. use `deploy_service` only as a low-level targeted redeploy escape hatch.

## troubleshooting

- **deploy fails**: check `list_apps` for status, check app.json is valid, then confirm control-plane targeted the right service and repo ref. use `build_app` only if you need to debug the build step separately
- **SSR app won't start**: verify `server.ts` and `startCommand`, check the Railway service logs for that app
- **static app shows blank**: verify `dist/` has `index.html`, check vite config `base` path
- **data not loading**: verify the platform or capability endpoint independently, then verify the app route or data API URL in the browser
- **rollback**: redeploy previous working version from git history
