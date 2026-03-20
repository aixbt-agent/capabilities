import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetCommodityQuotes,
  mockGetQuotes,
  mockGetSpotPrices,
} = vi.hoisted(() => ({
  mockGetCommodityQuotes: vi.fn(),
  mockGetQuotes: vi.fn(),
  mockGetSpotPrices: vi.fn(),
}));

vi.mock('../providers/cnbc.js', () => ({
  getCommodityQuotes: mockGetCommodityQuotes,
}));

vi.mock('../providers/yahoo-finance.js', () => ({
  getQuotes: mockGetQuotes,
}));

vi.mock('../providers/coinbase.js', () => ({
  getSpotPrices: mockGetSpotPrices,
}));

import fetchPrices from './fetch-prices.js';

describe('fetch-prices', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetCommodityQuotes.mockResolvedValue([]);
    mockGetQuotes.mockResolvedValue([]);
    mockGetSpotPrices.mockResolvedValue([]);
  });

  it('uses flat commodity aliases instead of object params', async () => {
    mockGetCommodityQuotes.mockResolvedValue([
      { symbol: 'gold', price: 2200, changePct: 0.4 },
      { symbol: 'silver', price: 25, changePct: -0.2 },
    ]);

    const result = await fetchPrices({
      commodities: ['gold', 'silver'],
    });

    expect(mockGetCommodityQuotes).toHaveBeenCalledWith({
      gold: '@GC.1',
      silver: '@SI.1',
    });
    expect(result).toEqual({
      gold: { symbol: 'gold', price: 2200, change_pct: 0.4 },
      silver: { symbol: 'silver', price: 25, change_pct: -0.2 },
    });
  });
});
