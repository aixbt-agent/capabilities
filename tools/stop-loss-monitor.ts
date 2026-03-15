// Monitors open positions against stop loss levels and auto-closes breached positions
import { getQuotes } from '../providers/yahoo-finance.js'
import { getSpotPrices } from '../providers/coinbase.js'
import pg from 'pg'

const SCHEMA = 'sk_portfolio'

interface Position {
  id: number
  symbol: string
  asset_class: string
  side: string
  entry_price: number
  quantity: number
  notional: number
  stop_loss: number | null
  current_price: number | null
}

async function run() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    // fetch open positions with stop losses
    const { rows: positions } = await client.query<Position>(
      `SELECT id, symbol, asset_class, side, entry_price, quantity, notional, stop_loss, current_price
       FROM ${SCHEMA}.positions WHERE status = 'open' AND stop_loss IS NOT NULL`
    )

    if (positions.length === 0) {
      console.log(JSON.stringify({ success: true, message: 'no positions with stop losses', checked: 0, closed: 0 }))
      return
    }

    // split into stocks and crypto
    const stockSymbols = positions
      .filter(p => p.asset_class !== 'crypto' || ['IBIT'].includes(p.symbol))
      .map(p => p.symbol)
    const cryptoPairs = positions
      .filter(p => p.asset_class === 'crypto' && !['IBIT'].includes(p.symbol))
      .map(p => `${p.symbol}-USD`)

    // fetch live prices
    const prices: Record<string, number> = {}
    const [stockQuotes, cryptoQuotes] = await Promise.all([
      stockSymbols.length > 0 ? getQuotes(stockSymbols) : Promise.resolve([]),
      cryptoPairs.length > 0 ? getSpotPrices(cryptoPairs) : Promise.resolve([]),
    ])
    for (const q of stockQuotes) prices[q.symbol] = q.regularMarketPrice
    for (const q of cryptoQuotes) prices[q.symbol] = q.price

    const closed: string[] = []

    for (const pos of positions) {
      const livePrice = prices[pos.symbol]
      if (livePrice == null || pos.stop_loss == null) continue

      // update current price regardless
      await client.query(
        `UPDATE ${SCHEMA}.positions SET current_price = $1 WHERE id = $2`,
        [livePrice, pos.id]
      )

      // check stop loss breach
      const breached = pos.side === 'long'
        ? livePrice <= pos.stop_loss
        : livePrice >= pos.stop_loss

      if (breached) {
        const pnl = (livePrice - pos.entry_price) * pos.quantity * (pos.side === 'long' ? 1 : -1)
        const pnlPct = ((livePrice - pos.entry_price) / pos.entry_price) * 100 * (pos.side === 'long' ? 1 : -1)

        // close the position
        await client.query(
          `UPDATE ${SCHEMA}.positions SET status = 'closed', exit_price = $1, exit_date = $2, pnl = $3, pnl_pct = $4, current_price = $1
           WHERE id = $5`,
          [livePrice, new Date().toISOString().split('T')[0], pnl, pnlPct, pos.id]
        )

        // log to journal
        await client.query(
          `INSERT INTO ${SCHEMA}.journal (action, symbol, details, reasoning, market_context)
           VALUES ('close', $1, $2, $3, $4)`,
          [
            pos.symbol,
            `stop loss triggered at $${livePrice.toFixed(2)}. exit ${pos.quantity} @ $${livePrice.toFixed(2)}. P&L: $${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%)`,
            `price breached stop loss of $${pos.stop_loss.toFixed(2)}. auto-closed by stop loss monitor.`,
            `entry was $${pos.entry_price.toFixed(2)}, stop was $${pos.stop_loss.toFixed(2)}, live price hit $${livePrice.toFixed(2)}`
          ]
        )

        closed.push(pos.symbol)
      }
    }

    console.log(JSON.stringify({
      success: true,
      checked: positions.length,
      closed: closed.length,
      closed_symbols: closed,
      prices,
      timestamp: new Date().toISOString()
    }))
  } finally {
    await client.end()
  }
}

run().catch(err => {
  console.log(JSON.stringify({ success: false, error: err.message }))
  process.exit(1)
})
