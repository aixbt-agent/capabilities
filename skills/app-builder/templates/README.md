`static-react` and `ssr-react` are starter templates for extracted `aixbt-agent/app-*` repos.

Replace these placeholders when scaffolding:

- `__APP_NAME__`
- `__APP_SUBDOMAIN__`
- `__APP_DESCRIPTION__`
- `__APP_PORT__`

Template rules:

- import UI from `@aixbt-agent/components`
- keep data hooks, fetch helpers, and server helpers local to the app repo
- use `capabilities` or platform HTTP endpoints for shared data access
- keep `app.json` and `app.sources.json` at the app repo root
