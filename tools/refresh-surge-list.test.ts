import { describe, expect, it } from 'vitest';
import {
  formatPgTextArray,
  normalizeSurgeProject,
  toApiProject,
  toSurgeListRow,
} from './refresh-surge-list.js';

describe('refresh-surge-list', () => {
  it('formats postgres text arrays', () => {
    expect(formatPgTextArray(['ethereum', 'base'])).toBe('{ethereum,base}');
    expect(formatPgTextArray(['Decentralized Exchange (DEX)', 'Governance'])).toBe(
      '{"Decentralized Exchange (DEX)",Governance}',
    );
  });

  it('normalizes projects for api and database output', () => {
    const normalized = normalizeSurgeProject({
      id: 'project-1',
      name: 'Balancer',
      description: 'dex',
      xHandle: 'balancer',
      momentumScore: 88.1,
      popularityScore: 41.5,
      metrics: {
        usd: 12.34,
        usdMarketCap: 987654,
        usd24hVol: 12345,
        usd24hChange: -4.2,
      },
      coingeckoData: {
        symbol: 'bal',
        categories: ['DeFi', 'AMM'],
      },
      tokens: [{ chain: 'ethereum' }, { chain: 'base' }, { chain: 'ethereum' }],
    });

    expect(toApiProject(normalized)).toEqual({
      id: 'project-1',
      name: 'Balancer',
      description: 'dex',
      xHandle: 'balancer',
      symbol: 'bal',
      categories: ['DeFi', 'AMM'],
      price: 12.34,
      marketCap: 987654,
      volume24h: 12345,
      change24h: -4.2,
      chains: ['ethereum', 'base'],
    });

    expect(toSurgeListRow(normalized)).toEqual({
      id: 'project-1',
      name: 'Balancer',
      description: 'dex',
      x_handle: 'balancer',
      momentum_score: 88.1,
      popularity_score: 41.5,
      symbol: 'bal',
      price_usd: 12.34,
      market_cap: 987654,
      volume_24h: 12345,
      change_24h: -4.2,
      chains: '{ethereum,base}',
      categories: '{DeFi,AMM}',
    });
  });
});
