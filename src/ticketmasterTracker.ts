import { promises as fs } from "node:fs";
import path from "node:path";

export type TicketmasterStatus =
  | "accessible"
  | "paused"
  | "security-check"
  | "blocked"
  | "error";

export interface TicketmasterResult {
  name: string;
  status: TicketmasterStatus;
  checkedAt: string;
}

const OUTPUT_DIR = path.resolve("results");

export async function saveTicketmasterResult(
  result: TicketmasterResult,
): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const filePath = path.join(
    OUTPUT_DIR,
    "ticketmaster-results.json",
  );

  let results: TicketmasterResult[] = [];

  try {
    const existing = await fs.readFile(filePath, "utf8");
    results = JSON.parse(existing) as TicketmasterResult[];
  } catch {
    results = [];
  }

  const existingIndex = results.findIndex(
    (item) => item.name === result.name,
  );

  if (existingIndex >= 0) {
    results[existingIndex] = result;
  } else {
    results.push(result);
  }

  await fs.writeFile(
    filePath,
    JSON.stringify(results, null, 2),
    "utf8",
  );

  await updateStatusFiles(results);
}

async function updateStatusFiles(
  results: TicketmasterResult[],
): Promise<void> {
  const statuses: TicketmasterStatus[] = [
    "accessible",
    "paused",
    "security-check",
    "blocked",
    "error",
  ];

  for (const status of statuses) {
    const names = results
      .filter((result) => result.status === status)
      .map((result) => result.name);

    const fileName = `ticketmaster-${status}.txt`;

    await fs.writeFile(
      path.join(OUTPUT_DIR, fileName),
      names.length > 0
        ? `${names.join("\n")}\n`
        : "",
      "utf8",
    );
  }
}