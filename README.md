# aixbt-agent/tools

Agent-editable data providers and tools. All `.ts` files live at the repo root.

**Providers** — fetch market data from external APIs:
- `cnbc.ts` — CNBC commodity quotes
- `coinbase.ts` — Coinbase spot prices
- `coingecko.ts` — CoinGecko market data
- `yahoo-finance.ts` — Yahoo Finance stock/ETF quotes

**Tools** — runnable scripts that use providers:
- `fetch-prices.ts` — configurable multi-source price fetcher
- `stop-loss-monitor.ts` — monitors positions and auto-closes on stop loss breach
