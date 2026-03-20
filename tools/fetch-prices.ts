/**
 * @tool
 * description: Fetch spot and market prices across the shared quote providers.
 */

import { getCommodityQuotes } from '../providers/cnbc.js'
import { getQuotes } from '../providers/yahoo-finance.js'
import { getSpotPrices } from '../providers/coinbase.js'
import { withToolMeta, type ToolMeta } from '../shared/contract.js'

interface PriceConfig {
  commodities?: string | string[]       // ['gold', 'silver', '@GC.1'] -> cnbc provider
  stocks?: string | string[]             // ['NVDA', 'AMD', ...] -> yahoo provider
  crypto?: string | string[]             // ['BTC-USD', ...] -> coinbase provider
}

interface PriceResult {
  symbol: string
  price: number
  change_pct: number
  open?: number
  high?: number
  low?: number
  volume?: number
  market_cap?: number
}

const toolMeta: ToolMeta = {
  runtime: 'orchestrator',
  roles: ['user', 'admin'],
  inputSchema: {
    crypto: 'string or string[] of quote symbols like BTC-USD or ETH-USD',
    stocks: 'string or string[] of equity symbols like SPY or NVDA',
    commodities: 'string or string[] of commodity aliases or CNBC symbols like gold, silver, or @GC.1',
  },
}

const COMMODITY_SYMBOLS = {
  gold: '@GC.1',
  silver: '@SI.1',
  wti: '@CL.1',
  brent: '@BZ.1',
  copper: '@HG.1',
  natural_gas: '@NG.1',
} as const

function normalizeCommoditySymbols(input: string | string[] | undefined): Record<string, string> {
  const items = Array.isArray(input) ? input : (input ? [input] : [])

  return Object.fromEntries(items
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((item) => {
      const alias = item
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || item

      return [alias, COMMODITY_SYMBOLS[alias as keyof typeof COMMODITY_SYMBOLS] ?? item]
    }))
}

async function fetchPrices(config: PriceConfig): Promise<Record<string, PriceResult>> {
  const prices: Record<string, PriceResult> = {}
  const tasks: Promise<void>[] = []
  const commodities = normalizeCommoditySymbols(config.commodities)
  const stocks = Array.isArray(config.stocks) ? config.stocks : (config.stocks ? [config.stocks] : [])
  const crypto = Array.isArray(config.crypto) ? config.crypto : (config.crypto ? [config.crypto] : [])

  if (Object.keys(commodities).length > 0) {
    tasks.push(
      getCommodityQuotes(commodities).then(quotes => {
        for (const q of quotes) {
          prices[q.symbol] = {
            symbol: q.symbol,
            price: q.price,
            change_pct: q.changePct,
          }
        }
      })
    )
  }

  if (stocks.length > 0) {
    tasks.push(
      getQuotes(stocks).then(quotes => {
        for (const q of quotes) {
          prices[q.symbol] = {
            symbol: q.symbol,
            price: q.regularMarketPrice,
            change_pct: q.regularMarketChangePercent ?? 0,
            open: q.regularMarketOpen,
            high: q.regularMarketDayHigh,
            low: q.regularMarketDayLow,
            volume: q.regularMarketVolume,
            market_cap: q.marketCap,
          }
        }
      })
    )
  }

  if (crypto.length > 0) {
    tasks.push(
      getSpotPrices(crypto).then(quotes => {
        for (const q of quotes) {
          prices[q.symbol] = {
            symbol: q.symbol,
            price: q.price,
            change_pct: 0,
          }
        }
      })
    )
  }

  await Promise.all(tasks)
  return prices
}

export default withToolMeta(fetchPrices, toolMeta)
export { fetchPrices }
