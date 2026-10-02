import axios from "axios";
import type { Proxy, ProxyCheckResult } from "./types.js";

export type TicketmasterStatus =
  | "accessible"
  | "paused"
  | "suspended"
  | "security-check"
  | "proxy-detected"
  | "blocked"
  | "error";

export interface TicketmasterCheckResult {
  proxy: Proxy;
  status: TicketmasterStatus;
  httpStatus?: number;
  latency?: number;
  message?: string;
  checkedAt: string;
}

const TEST_URL = "https://www.ticketmaster.com/";

function detectTicketmasterStatus(
  statusCode: number,
  body: string,
): TicketmasterStatus {
  const text = body.toLowerCase();

  if (
    text.includes("your browsing activity has been paused") ||
    text.includes("activity has been paused")
  ) {
    return "paused";
  }

  if (
    text.includes("activity has been suspended") ||
    text.includes("session has been suspended") ||
    text.includes("activity has been paused or suspended")
  ) {
    return "suspended";
  }

  if (
    text.includes("security check") ||
    text.includes("verify it's you") ||
    text.includes("verify you are human") ||
    text.includes("persona")
  ) {
    return "security-check";
  }

  if (
    text.includes("vpn") ||
    text.includes("proxy server") ||
    text.includes("privacy tool")
  ) {
    return "proxy-detected";
  }

  if (statusCode === 401 || statusCode === 403) {
    return "blocked";
  }

  if (statusCode >= 200 && statusCode < 400) {
    return "accessible";
  }

  return "error";
}

export async function checkTicketmaster(
  proxy: Proxy,
  timeout = 10000,
): Promise<TicketmasterCheckResult> {
  const start = performance.now();

  try {
    const response = await axios.get(TEST_URL, {
      timeout,
      proxy: {
        protocol: proxy.protocol,
        host: proxy.host,
        port: proxy.port,
        ...(proxy.username && proxy.password
          ? {
              auth: {
                username: proxy.username,
                password: proxy.password,
              },
            }
          : {}),
      },
      validateStatus: () => true,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36",
      },
    });

    const latency = Math.round(performance.now() - start);

    const body =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);

    const status = detectTicketmasterStatus(
      response.status,
      body,
    );

    return {
      proxy,
      status,
      httpStatus: response.status,
      latency,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const latency = Math.round(performance.now() - start);

    let message = "Unknown error";

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        message = "Timeout";
      } else if (error.code) {
        message = error.code;
      } else if (error.message) {
        message = error.message;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return {
      proxy,
      status: "error",
      latency,
      message,
      checkedAt: new Date().toISOString(),
    };
  }
}