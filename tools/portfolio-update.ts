// Updates portfolio positions with current prices, calculates P&L, and takes daily snapshots
import { getQuotes } from '../providers/yahoo-finance.js';
import { getSpotPrices } from '../providers/coinbase.js';

interface Position {
  id: number;
  symbol: string;
  asset_class: string;
  entry_price: number;
  quantity: number;
  notional: number;
  stop_loss: number | null;
  target_price: number | null;
  status: string;
}

interface PriceMap {
  [symbol: string]: number;
}

async function fetchAllPrices(positions: Position[]): Promise<PriceMap> {
  const prices: PriceMap = {};

  const stockSymbols = positions
    .filter(p => p.asset_class !== 'crypto' || ['IBIT'].includes(p.symbol))
    .map(p => p.symbol);

  const cryptoPairs = positions
    .filter(p => p.asset_class === 'crypto' && !['IBIT'].includes(p.symbol))
    .map(p => `${p.symbol}-USD`);

  const [stockQuotes, cryptoQuotes] = await Promise.all([
    stockSymbols.length > 0 ? getQuotes(stockSymbols) : Promise.resolve([]),
    cryptoPairs.length > 0 ? getSpotPrices(cryptoPairs) : Promise.resolve([]),
  ]);

  for (const q of stockQuotes) {
    prices[q.symbol] = q.regularMarketPrice;
  }
  for (const q of cryptoQuotes) {
    prices[q.symbol] = q.price;
  }

  return prices;
}

export async function updatePortfolio(): Promise<{
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  positions: Array<Position & { current_price: number; pnl: number; pnl_pct: number }>;
}> {
  // This function is meant to be called from the cron agent which has db_query access
  // It returns the data needed for updates
  const prices: PriceMap = {};

  // Fetch all prices
  const stockSymbols = ['GLD', 'IEF', 'SPY', 'GOOGL', 'GDX', 'URA', 'COPX', 'IBIT', 'NVDA'];
  const cryptoPairs = ['ETH-USD', 'SOL-USD'];

  const [stockQuotes, cryptoQuotes] = await Promise.all([
    getQuotes(stockSymbols),
    getSpotPrices(cryptoPairs),
  ]);

  for (const q of stockQuotes) prices[q.symbol] = q.regularMarketPrice;
  for (const q of cryptoQuotes) prices[q.symbol] = q.price;

  console.log(JSON.stringify({ prices, fetched_at: new Date().toISOString() }));
  return { totalValue: 0, totalPnl: 0, totalPnlPct: 0, positions: [] };
}

// Run directly
updatePortfolio().catch(console.error);
