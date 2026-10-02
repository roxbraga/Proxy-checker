import { promises as fs } from "node:fs";
import path from "node:path";

export async function readProxyFile(
  filePath: string,
): Promise<string[]> {
  const content = await fs.readFile(filePath, "utf8");

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("#"));
}

export async function writeLines(
  filePath: string,
  lines: string[],
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), {
    recursive: true,
  });

  const content = lines.length > 0
    ? `${lines.join("\n")}\n`
    : "";

  await fs.writeFile(filePath, content, "utf8");
}

export async function writeJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), {
    recursive: true,
  });

  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8",
  );
}