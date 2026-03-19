import pg from 'pg';

export interface ToolStorage {
  schema: string;
  bootstrapSql: string[];
}

export interface ToolManagedRunner<Params, Result> {
  (params?: Params): Promise<Result>;
  toolStorage: ToolStorage;
}

interface CreateToolManagedRunnerOptions<Params, Result> {
  storage: ToolStorage;
  run: (client: pg.Client, params: Params) => Promise<Result> | Result;
}

export function createToolManagedRunner<Params extends object, Result>(
  options: CreateToolManagedRunnerOptions<Params, Result>,
): ToolManagedRunner<Params, Result> {
  const runner = async (params: Params = {} as Params): Promise<Result> => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${options.storage.schema}`);
      for (const statement of options.storage.bootstrapSql) {
        await client.query(statement);
      }

      return await options.run(client, params);
    } finally {
      await client.end();
    }
  };

  runner.toolStorage = options.storage;
  return runner;
}
