// Fetches and writes the latest Fed liquidity snapshot to the database
import pg from 'pg';
import { getCommodityQuotes } from './cnbc.js';
import { getQuotes } from './yahoo-finance.js';

const SCHEMA = 'sk_fed_liquidity';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ETF_SYMBOLS = ['SHY', 'IEF', 'TLT', 'UUP', 'HYG', 'LQD', 'TIP', 'SPY', 'AGG'] as const;
const COMMODITY_SYMBOLS = { gold: '@GC.1', wti: '@CL.1' } as const;

export interface MarketRate {
  symbol: string;
  value: number;
  change: number;
}

export interface MarketPrice {
  symbol: string;
  price: number;
  change_pct: number;
}

export interface YieldPoint {
  maturity: string;
  yield: number;
}

export interface Spreads {
  '3m10y': number;
  '5s30s': number;
  curve_shape: string;
}

export interface FedLiquidityMarketData {
  rates: MarketRate[];
  prices: MarketPrice[];
  yieldCurve: YieldPoint[];
  spreads: Spreads;
  fetched_at: string;
}

export interface FedLiquiditySnapshotRow {
  t3m: number | null;
  t5y: number | null;
  t10y: number | null;
  t30y: number | null;
  vix: number | null;
  dxy_uup: number | null;
  spread_3m10y: number | null;
  spread_5s30s: number | null;
  curve_shape: string | null;
  hyg: number | null;
  lqd: number | null;
  spy: number | null;
  gold: number | null;
  regime: 'risk-on' | 'risk-off' | 'neutral';
}

function findRate(data: FedLiquidityMarketData, symbol: string): MarketRate | undefined {
  return data.rates.find((entry) => entry.symbol === symbol);
}

function findPrice(data: FedLiquidityMarketData, symbol: string): MarketPrice | undefined {
  return data.prices.find((entry) => entry.symbol === symbol);
}

function computeCurveShape(spread3m10y: number): string {
  if (spread3m10y > 0.5) return 'normal';
  if (spread3m10y < -0.1) return 'inverted';
  return 'flat';
}

export async function fetchYieldsAndVix(): Promise<MarketRate[]> {
  const cnbcSymbols: Record<string, string> = {
    '^IRX': 'US3M',
    '^FVX': 'US5Y',
    '^TNX': 'US10Y',
    '^TYX': 'US30Y',
  };

  const url = `https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=${[...Object.values(cnbcSymbols), '.VIX'].join('|')}&requestMethod=itv&noSubscription=1&partnerId=2&fund=1&exthrs=1&output=json&events=1`;
  const response = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`CNBC yields+VIX fetch failed with status ${response.status}`);
  }

  const body = await response.json();
  const cnbcToDisplay = Object.fromEntries(Object.entries(cnbcSymbols).map(([display, cnbc]) => [cnbc, display]));
  const results: MarketRate[] = [];

  for (const quote of body.FormattedQuoteResult?.FormattedQuote || []) {
    const value = parseFloat(String(quote.last).replace(/[,%]/g, ''));
    const change = parseFloat(String(quote.change_pct).replace(/[%+]/g, ''));
    if (Number.isNaN(value) || value <= 0) {
      continue;
    }

    if (quote.symbol === '.VIX') {
      results.push({ symbol: '^VIX', value, change: Number.isNaN(change) ? 0 : change });
      continue;
    }

    const displaySymbol = cnbcToDisplay[quote.symbol];
    if (displaySymbol) {
      results.push({ symbol: displaySymbol, value, change: Number.isNaN(change) ? 0 : change });
    }
  }

  return results;
}

export function classifyFedLiquidityRegime(data: FedLiquidityMarketData): 'risk-on' | 'risk-off' | 'neutral' {
  const vix = findRate(data, '^VIX')?.value ?? 0;
  const spread3m10y = data.spreads['3m10y'];
  const spyChange = findPrice(data, 'SPY')?.change_pct ?? 0;
  const hyg = findPrice(data, 'HYG')?.price ?? 0;
  const lqd = findPrice(data, 'LQD')?.price ?? 0;
  const hygLqdRatio = hyg > 0 && lqd > 0 ? hyg / lqd : null;

  let riskOffScore = 0;
  let riskOnScore = 0;

  if (vix >= 25) riskOffScore++;
  if (spread3m10y < 0) riskOffScore++;
  if (spyChange <= -1) riskOffScore++;
  if (hygLqdRatio != null && hygLqdRatio < 0.75) riskOffScore++;

  if (vix > 0 && vix <= 17) riskOnScore++;
  if (spread3m10y > 0.5) riskOnScore++;
  if (spyChange >= 0.75) riskOnScore++;
  if (hygLqdRatio != null && hygLqdRatio > 0.78) riskOnScore++;

  if (riskOffScore >= 2) return 'risk-off';
  if (riskOnScore >= 3) return 'risk-on';
  return 'neutral';
}

export async function fetchFedLiquidityMarketData(): Promise<FedLiquidityMarketData> {
  const [yieldResult, etfResult, commodityResult] = await Promise.allSettled([
    fetchYieldsAndVix(),
    getQuotes([...ETF_SYMBOLS]),
    getCommodityQuotes({ ...COMMODITY_SYMBOLS }),
  ]);

  const rates = yieldResult.status === 'fulfilled' ? yieldResult.value : [];
  const etfQuotes = etfResult.status === 'fulfilled' ? etfResult.value : [];
  const commodityQuotes = commodityResult.status === 'fulfilled' ? commodityResult.value : [];

  if (rates.length === 0) {
    throw new Error(
      `yield refresh failed: ${yieldResult.status === 'rejected' ? String(yieldResult.reason) : 'no data returned'}`,
    );
  }

  const yieldMap = Object.fromEntries(rates.map((quote) => [quote.symbol, quote]));
  const t3m = yieldMap['^IRX']?.value ?? 0;
  const t5y = yieldMap['^FVX']?.value ?? 0;
  const t10y = yieldMap['^TNX']?.value ?? 0;
  const t30y = yieldMap['^TYX']?.value ?? 0;
  const spread3m10y = t10y - t3m;
  const spread5s30s = t30y - t5y;

  const prices: MarketPrice[] = [
    ...etfQuotes.map((quote) => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change_pct: quote.regularMarketChangePercent,
    })),
    ...commodityQuotes.map((quote) => ({
      symbol: quote.symbol,
      price: quote.price,
      change_pct: quote.changePct,
    })),
  ];

  return {
    rates,
    prices,
    yieldCurve: [
      { maturity: '3M', yield: t3m },
      { maturity: '5Y', yield: t5y },
      { maturity: '10Y', yield: t10y },
      { maturity: '30Y', yield: t30y },
    ],
    spreads: {
      '3m10y': spread3m10y,
      '5s30s': spread5s30s,
      curve_shape: computeCurveShape(spread3m10y),
    },
    fetched_at: new Date().toISOString(),
  };
}

export function buildFedLiquiditySnapshotRow(data: FedLiquidityMarketData): FedLiquiditySnapshotRow {
  return {
    t3m: findRate(data, '^IRX')?.value ?? null,
    t5y: findRate(data, '^FVX')?.value ?? null,
    t10y: findRate(data, '^TNX')?.value ?? null,
    t30y: findRate(data, '^TYX')?.value ?? null,
    vix: findRate(data, '^VIX')?.value ?? null,
    dxy_uup: findPrice(data, 'UUP')?.price ?? null,
    spread_3m10y: data.spreads['3m10y'],
    spread_5s30s: data.spreads['5s30s'],
    curve_shape: data.spreads.curve_shape,
    hyg: findPrice(data, 'HYG')?.price ?? null,
    lqd: findPrice(data, 'LQD')?.price ?? null,
    spy: findPrice(data, 'SPY')?.price ?? null,
    gold: findPrice(data, 'gold')?.price ?? null,
    regime: classifyFedLiquidityRegime(data),
  };
}

export interface RefreshFedLiquidityParams {
  prune_days?: string | number;
}

export async function refreshFedLiquidity(
  params: RefreshFedLiquidityParams = {},
): Promise<{ fetchedAt: string; insertedSnapshot: number; prunedSnapshots: number; regime: string }> {
  const pruneDays = Number.parseInt(String(params.prune_days ?? '30'), 10);
  const retentionDays = Number.isFinite(pruneDays) && pruneDays > 0 ? pruneDays : 30;
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const marketData = await fetchFedLiquidityMarketData();
    const snapshot = buildFedLiquiditySnapshotRow(marketData);

    await client.query(
      `INSERT INTO ${SCHEMA}.snapshots (
        t3m, t5y, t10y, t30y, vix, dxy_uup, spread_3m10y, spread_5s30s,
        curve_shape, hyg, lqd, spy, gold, regime
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14
      )`,
      [
        snapshot.t3m,
        snapshot.t5y,
        snapshot.t10y,
        snapshot.t30y,
        snapshot.vix,
        snapshot.dxy_uup,
        snapshot.spread_3m10y,
        snapshot.spread_5s30s,
        snapshot.curve_shape,
        snapshot.hyg,
        snapshot.lqd,
        snapshot.spy,
        snapshot.gold,
        snapshot.regime,
      ],
    );

    const pruneResult = await client.query(
      `DELETE FROM ${SCHEMA}.snapshots WHERE created_at < NOW() - ($1::text || ' days')::interval`,
      [String(retentionDays)],
    );

    return {
      fetchedAt: marketData.fetched_at,
      insertedSnapshot: 1,
      prunedSnapshots: pruneResult.rowCount ?? 0,
      regime: snapshot.regime,
    };
  } finally {
    await client.end();
  }
}

export default refreshFedLiquidity;
