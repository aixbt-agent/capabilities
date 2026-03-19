// Fetches the latest surge list from the aixbt API and writes it to the database
import pg from 'pg';

const BASE = 'https://api.aixbt.tech/v2';
const API_KEY = process.env.AIXBT_API_KEY || '';
const SCHEMA = 'sk_aixbt_surge';

export interface SurgeProject {
  id: string;
  name: string;
  description: string | null;
  xHandle: string | null;
  momentumScore: number | null;
  popularityScore: number | null;
  symbol: string;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  chains: string[];
  categories: string[];
}

function asNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
  return Number.isFinite(num) ? num : 0;
}

function asNullableNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(num) ? num : null;
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
}

export function formatPgTextArray(values: string[]): string {
  if (values.length === 0) return '{}';

  const escaped = values.map((value) => {
    const item = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return /[,\s{}"]/u.test(item) ? `"${item}"` : item;
  });

  return `{${escaped.join(',')}}`;
}

async function aixbtFetch(apiPath: string, fetchImpl: typeof fetch = fetch): Promise<any> {
  const response = await fetchImpl(`${BASE}${apiPath}`, {
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`AIXBT ${apiPath} -> ${response.status}`);
  }

  return response.json();
}

export function normalizeSurgeProject(project: any): SurgeProject {
  const rawCategories = Array.isArray(project.coingeckoData?.categories)
    ? project.coingeckoData.categories
    : Array.isArray(project.categories)
      ? project.categories
      : [];

  return {
    id: String(project.id ?? ''),
    name: String(project.name ?? '').trim(),
    description: typeof project.description === 'string' && project.description.trim() ? project.description.trim() : null,
    xHandle: typeof project.xHandle === 'string' && project.xHandle.trim() ? project.xHandle.trim() : null,
    momentumScore: asNullableNumber(project.momentumScore ?? project.metrics?.momentumScore),
    popularityScore: asNullableNumber(project.popularityScore ?? project.metrics?.popularityScore),
    symbol: typeof project.coingeckoData?.symbol === 'string' ? project.coingeckoData.symbol : '',
    priceUsd: asNumber(project.metrics?.usd),
    marketCap: asNumber(project.metrics?.usdMarketCap),
    volume24h: asNumber(project.metrics?.usd24hVol),
    change24h: asNumber(project.metrics?.usd24hChange),
    chains: uniqueStrings((project.tokens || []).map((token: any) => token.chain)),
    categories: uniqueStrings(rawCategories),
  };
}

export function toApiProject(project: SurgeProject) {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? '',
    xHandle: project.xHandle ?? '',
    symbol: project.symbol,
    categories: project.categories,
    price: project.priceUsd,
    marketCap: project.marketCap,
    volume24h: project.volume24h,
    change24h: project.change24h,
    chains: project.chains,
  };
}

export function toSurgeListRow(project: SurgeProject) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    x_handle: project.xHandle,
    momentum_score: project.momentumScore,
    popularity_score: project.popularityScore,
    symbol: project.symbol,
    price_usd: project.priceUsd,
    market_cap: project.marketCap,
    volume_24h: project.volume24h,
    change_24h: project.change24h,
    chains: formatPgTextArray(project.chains),
    categories: formatPgTextArray(project.categories),
  };
}

export async function fetchSurgingProjects(limit = 10, fetchImpl: typeof fetch = fetch): Promise<SurgeProject[]> {
  const body = await aixbtFetch(`/projects?limit=${limit}&sortBy=momentumScore&excludeStables=true`, fetchImpl);
  const rows = Array.isArray(body.data) ? body.data : [];
  return rows.map(normalizeSurgeProject).filter((project) => project.id && project.name);
}

export interface RefreshSurgeListParams {
  limit?: string | number;
}

export async function refreshSurgeList(
  params: RefreshSurgeListParams = {},
): Promise<{ projectsFetched: number; projectsUpserted: number }> {
  const limit = Number.parseInt(String(params.limit ?? '10'), 10);
  const fetchLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const projects = await fetchSurgingProjects(fetchLimit);

    for (const project of projects) {
      const row = toSurgeListRow(project);
      await client.query(
        `INSERT INTO ${SCHEMA}.surge_list (
          id, name, description, x_handle, momentum_score, popularity_score,
          symbol, price_usd, market_cap, volume_24h, change_24h, chains, categories,
          first_seen_at, last_seen_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13,
          NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          x_handle = EXCLUDED.x_handle,
          momentum_score = EXCLUDED.momentum_score,
          popularity_score = EXCLUDED.popularity_score,
          symbol = EXCLUDED.symbol,
          price_usd = EXCLUDED.price_usd,
          market_cap = EXCLUDED.market_cap,
          volume_24h = EXCLUDED.volume_24h,
          change_24h = EXCLUDED.change_24h,
          chains = EXCLUDED.chains,
          categories = EXCLUDED.categories,
          last_seen_at = NOW()`,
        [
          row.id,
          row.name,
          row.description,
          row.x_handle,
          row.momentum_score,
          row.popularity_score,
          row.symbol,
          row.price_usd,
          row.market_cap,
          row.volume_24h,
          row.change_24h,
          row.chains,
          row.categories,
        ],
      );
    }

    return {
      projectsFetched: projects.length,
      projectsUpserted: projects.length,
    };
  } finally {
    await client.end();
  }
}

export default refreshSurgeList;
