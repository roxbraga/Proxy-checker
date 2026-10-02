import pLimit from "p-limit";
import type { Proxy, ProxyCheckResult } from "./types.js";
import { checkProxy } from "./checker.js";

export interface BulkCheckOptions {
  concurrency?: number;
  timeout?: number;
  onResult?: (result: ProxyCheckResult, completed: number, total: number) => void;
}

export async function checkProxies(
  proxies: Proxy[],
  options: BulkCheckOptions = {},
): Promise<ProxyCheckResult[]> {
  const concurrency = options.concurrency ?? 25;
  const timeout = options.timeout ?? 8000;

  const limit = pLimit(concurrency);

  let completed = 0;

  const tasks = proxies.map((proxy) =>
    limit(async () => {
      const result = await checkProxy(proxy, timeout);

      completed++;

      options.onResult?.(
        result,
        completed,
        proxies.length,
      );

      return result;
    }),
  );

  return Promise.all(tasks);
}