import path from "node:path";

import { checkProxies } from "./bulkChecker.js";
import {
  readProxyFile,
  writeJson,
  writeLines,
} from "./fileManager.js";
import { parseProxy } from "./parser.js";
import type { Proxy } from "./types.js";

const INPUT_FILE = path.resolve("proxies.txt");
const OUTPUT_DIR = path.resolve("results");

const CONCURRENCY = 25;
const TIMEOUT = 8000;
const TOP_RESULTS = 10;

async function main(): Promise<void> {
  console.log("=================================");
  console.log("        PROXY CHECKER");
  console.log("=================================\n");

  console.log(`Input:       ${INPUT_FILE}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Timeout:     ${TIMEOUT}ms\n`);

  const proxyInputs = await readProxyFile(INPUT_FILE);

  console.log(`Loaded ${proxyInputs.length} proxies.\n`);

  const proxies: Proxy[] = [];

  for (let index = 0; index < proxyInputs.length; index++) {
  const input = proxyInputs[index];

  try {
    const namedInput = input.includes("|")
      ? input
      : `Proxy${index + 1}|${input}`;

    proxies.push(parseProxy(namedInput));
  } catch (error) {
    console.error(`Invalid proxy: ${input}`);

    if (error instanceof Error) {
      console.error(`Reason: ${error.message}`);
    }

    console.error();
  }
}

  console.log(`Valid proxies: ${proxies.length}`);
  console.log("Starting checks...\n");

  const results = await checkProxies(proxies, {
    concurrency: CONCURRENCY,
    timeout: TIMEOUT,

    onResult: (result, completed, total) => {
      const proxyAddress = `${result.proxy.host}:${result.proxy.port}`;

      const latency =
        result.latency !== undefined
          ? `${result.latency}ms`
          : "-";

      const error = result.error
        ? ` - ${result.error}`
        : "";

      console.log(
        `[${completed}/${total}] ` +
        `${result.status.toUpperCase()} ` +
        `${result.proxy.name} ` +
        `${proxyAddress} ` +
        `${latency}${error}`,
      );
    },
  });

  const working = results.filter(
    (result) => result.status === "working",
  );

  const dead = results.filter(
    (result) => result.status === "dead",
  );

  const fast = results.filter(
    (result) => result.speed === "fast",
  );

  const good = results.filter(
    (result) => result.speed === "good",
  );

  const slow = results.filter(
    (result) => result.speed === "slow",
  );

  const verySlow = results.filter(
    (result) => result.speed === "very-slow",
  );

  const sortedWorking = [...working].sort(sortByLatency);

  const fastest = sortedWorking.slice(0, TOP_RESULTS);

  await writeLines(
    path.join(OUTPUT_DIR, "working.txt"),
    sortedWorking.map((result) => formatProxy(result.proxy)),
  );

  await writeLines(
    path.join(OUTPUT_DIR, "dead.txt"),
    dead.map((result) => formatProxy(result.proxy)),
  );

  await writeLines(
    path.join(OUTPUT_DIR, "fast.txt"),
    [...fast]
      .sort(sortByLatency)
      .map((result) => formatProxy(result.proxy)),
  );

  await writeLines(
    path.join(OUTPUT_DIR, "good.txt"),
    [...good]
      .sort(sortByLatency)
      .map((result) => formatProxy(result.proxy)),
  );

  await writeLines(
    path.join(OUTPUT_DIR, "slow.txt"),
    [...slow]
      .sort(sortByLatency)
      .map((result) => formatProxy(result.proxy)),
  );

  await writeLines(
    path.join(OUTPUT_DIR, "very-slow.txt"),
    [...verySlow]
      .sort(sortByLatency)
      .map((result) => formatProxy(result.proxy)),
  );

  await writeJson(
    path.join(OUTPUT_DIR, "results.json"),
    results,
  );

  console.log("\n=================================");
  console.log("             SUMMARY");
  console.log("=================================");

  console.log(`Total:      ${results.length}`);
  console.log(`Working:    ${working.length}`);
  console.log(`Dead:       ${dead.length}`);
  console.log();

  console.log(`Fast:       ${fast.length}`);
  console.log(`Good:       ${good.length}`);
  console.log(`Slow:       ${slow.length}`);
  console.log(`Very slow:  ${verySlow.length}`);

  console.log("\n=================================");
  console.log("         TOP 10 FASTEST");
  console.log("=================================");

  fastest.forEach((result, index) => {
    const latency = result.latency ?? 0;

    console.log(
      `${String(index + 1).padStart(2, " ")}. ` +
      `${result.proxy.name} - ${latency}ms`,
    );
  });

  console.log(`\nResults saved to: ${OUTPUT_DIR}`);
}

function sortByLatency(
  a: { latency?: number },
  b: { latency?: number },
): number {
  return (
    (a.latency ?? Infinity) -
    (b.latency ?? Infinity)
  );
}

function formatProxy(proxy: Proxy): string {
  const proxyValue =
    proxy.username && proxy.password
      ? `${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      : `${proxy.host}:${proxy.port}`;

  return `${proxy.name}|${proxyValue}`;
}

main().catch((error: unknown) => {
  console.error("\nFatal error:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});