import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockConnect = vi.fn();
const mockQuery = vi.fn();
const mockEnd = vi.fn();

vi.mock('pg', () => {
  const MockClient = function (this: { connect: typeof mockConnect; query: typeof mockQuery; end: typeof mockEnd }, opts: unknown) {
    this.connect = mockConnect;
    this.query = mockQuery;
    this.end = mockEnd;
    (MockClient as unknown as { lastOpts: unknown }).lastOpts = opts;
  };

  return { default: { Client: MockClient } };
});

describe('tool-managed runner', () => {
  beforeEach(() => {
    vi.resetModules();
    mockConnect.mockReset();
    mockQuery.mockReset();
    mockEnd.mockReset();
    mockConnect.mockResolvedValue(undefined);
    mockQuery.mockResolvedValue({ rowCount: 0 });
    mockEnd.mockResolvedValue(undefined);
  });

  it('bootstraps schema and tables before invoking custom logic', async () => {
    const { createToolManagedRunner } = await import('./tool-managed.js');
    const run = vi.fn().mockResolvedValue({ ok: true });

    const tool = createToolManagedRunner({
      storage: {
        schema: 'sk_example',
        bootstrapSql: [
          'CREATE TABLE IF NOT EXISTS sk_example.rows (id TEXT PRIMARY KEY)',
          'CREATE INDEX IF NOT EXISTS rows_id_idx ON sk_example.rows (id)',
        ],
      },
      run,
    });

    await expect(tool({ limit: 2 })).resolves.toEqual({ ok: true });

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls.map((call) => call[0])).toEqual([
      'CREATE SCHEMA IF NOT EXISTS sk_example',
      'CREATE TABLE IF NOT EXISTS sk_example.rows (id TEXT PRIMARY KEY)',
      'CREATE INDEX IF NOT EXISTS rows_id_idx ON sk_example.rows (id)',
    ]);
    expect(run).toHaveBeenCalledWith(expect.objectContaining({ query: mockQuery }), { limit: 2 });
    expect(mockEnd).toHaveBeenCalledTimes(1);

    const pg = await import('pg');
    const Client = pg.default.Client as unknown as { lastOpts: unknown };
    expect(Client.lastOpts).toEqual({
      connectionString: process.env.DATABASE_URL,
    });
  });

  it('still closes the client when custom logic throws', async () => {
    const { createToolManagedRunner } = await import('./tool-managed.js');
    const tool = createToolManagedRunner({
      storage: {
        schema: 'sk_example',
        bootstrapSql: ['CREATE TABLE IF NOT EXISTS sk_example.rows (id TEXT PRIMARY KEY)'],
      },
      run: async () => {
        throw new Error('boom');
      },
    });

    await expect(tool()).rejects.toThrow('boom');
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });
});
