/**
 * @tool
 * description: Fetch spot and market prices across the shared quote providers.
 * use_when: Reading live prices inside shared tool logic without persisting rows.
 * persistence: none
 */

import { getCommodityQuotes } from '../providers/cnbc.js'
import { getQuotes } from '../providers/yahoo-finance.js'
import { getSpotPrices } from '../providers/coinbase.js'

interface PriceConfig {
  commodities?: Record<string, string>  // { gold: '@GC.1', ... } -> cnbc provider
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

export default async function fetchPrices(config: PriceConfig): Promise<Record<string, PriceResult>> {
  const prices: Record<string, PriceResult> = {}
  const tasks: Promise<void>[] = []
  const stocks = Array.isArray(config.stocks) ? config.stocks : (config.stocks ? [config.stocks] : [])
  const crypto = Array.isArray(config.crypto) ? config.crypto : (config.crypto ? [config.crypto] : [])

  if (config.commodities && Object.keys(config.commodities).length > 0) {
    tasks.push(
      getCommodityQuotes(config.commodities).then(quotes => {
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

export { fetchPrices }
