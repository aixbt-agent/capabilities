// fetch-prices.ts
// Reusable price-fetching tool. Accepts a JSON config specifying what to fetch
// from CNBC (commodities), Yahoo Finance (stocks), and Coinbase (crypto).
// Usage: tsx tools/fetch-prices.ts '{"stocks":["NVDA","AMD"],"crypto":["BTC-USD"]}'

import { getCommodityQuotes } from '../providers/cnbc.js'
import { getQuotes } from '../providers/yahoo-finance.js'
import { getSpotPrices } from '../providers/coinbase.js'

interface PriceConfig {
  commodities?: Record<string, string>  // { gold: '@GC.1', ... } -> cnbc provider
  stocks?: string[]                      // ['NVDA', 'AMD', ...] -> yahoo provider
  crypto?: string[]                      // ['BTC-USD', ...] -> coinbase provider
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

async function fetchPrices(config: PriceConfig): Promise<Record<string, PriceResult>> {
  const prices: Record<string, PriceResult> = {}
  const tasks: Promise<void>[] = []

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

  if (config.stocks && config.stocks.length > 0) {
    tasks.push(
      getQuotes(config.stocks).then(quotes => {
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

  if (config.crypto && config.crypto.length > 0) {
    tasks.push(
      getSpotPrices(config.crypto).then(quotes => {
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

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.log(JSON.stringify({ success: false, error: 'Usage: tsx tools/fetch-prices.ts \'{"stocks":["NVDA"]}\'' }))
    process.exit(1)
  }

  try {
    const config: PriceConfig = JSON.parse(input)
    const prices = await fetchPrices(config)

    console.log(JSON.stringify({
      success: true,
      prices,
      fetched_at: new Date().toISOString(),
      count: Object.keys(prices).length,
    }))
  } catch (error: any) {
    console.log(JSON.stringify({
      success: false,
      error: error.message,
    }))
    process.exit(1)
  }
}

main()
