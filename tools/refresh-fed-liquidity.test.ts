import { describe, expect, it } from 'vitest';
import {
  buildFedLiquiditySnapshotRow,
  classifyFedLiquidityRegime,
  type FedLiquidityMarketData,
} from './refresh-fed-liquidity.js';

describe('refresh-fed-liquidity', () => {
  it('builds a deterministic snapshot row and regime', () => {
    const marketData: FedLiquidityMarketData = {
      rates: [
        { symbol: '^IRX', value: 4.0, change: 0 },
        { symbol: '^FVX', value: 4.1, change: 0 },
        { symbol: '^TNX', value: 4.8, change: 0 },
        { symbol: '^TYX', value: 5.0, change: 0 },
        { symbol: '^VIX', value: 30, change: 0 },
      ],
      prices: [
        { symbol: 'UUP', price: 28, change_pct: 0.2 },
        { symbol: 'HYG', price: 74, change_pct: -0.8 },
        { symbol: 'LQD', price: 110, change_pct: -0.1 },
        { symbol: 'SPY', price: 500, change_pct: -1.2 },
        { symbol: 'gold', price: 2200, change_pct: 0.4 },
      ],
      yieldCurve: [],
      spreads: {
        '3m10y': 0.8,
        '5s30s': 0.9,
        curve_shape: 'normal',
      },
      fetched_at: '2026-03-19T00:00:00.000Z',
    };

    expect(classifyFedLiquidityRegime(marketData)).toBe('risk-off');
    expect(buildFedLiquiditySnapshotRow(marketData)).toEqual({
      t3m: 4.0,
      t5y: 4.1,
      t10y: 4.8,
      t30y: 5.0,
      vix: 30,
      dxy_uup: 28,
      spread_3m10y: 0.8,
      spread_5s30s: 0.9,
      curve_shape: 'normal',
      hyg: 74,
      lqd: 110,
      spy: 500,
      gold: 2200,
      regime: 'risk-off',
    });
  });
});
