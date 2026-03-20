export type ToolRuntime = 'orchestrator' | 'execute' | 'both';
export type ToolRole = 'admin' | 'user';

export interface ToolMeta {
  runtime: ToolRuntime;
  roles: ToolRole[];
  inputSchema?: Record<string, string>;
}

export interface ToolRunner<Params, Result> {
  (params?: Params): Promise<Result> | Result;
  toolMeta: ToolMeta;
}

export function withToolMeta<Params, Result>(
  runner: (params?: Params) => Promise<Result> | Result,
  toolMeta: ToolMeta,
): ToolRunner<Params, Result> {
  return Object.assign(runner, { toolMeta });
}
