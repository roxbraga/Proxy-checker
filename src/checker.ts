import axios from "axios";
import type {
  Proxy,
  ProxyCheckResult,
  ProxySpeed,
} from "./types.js";

const TEST_URL = "https://www.cloudflare.com/cdn-cgi/trace";

function classifySpeed(latency: number): ProxySpeed {
  if (latency < 500) {
    return "fast";
  }

  if (latency < 1000) {
    return "good";
  }

  if (latency < 2000) {
    return "slow";
  }

  return "very-slow";
}

export async function checkProxy(
  proxy: Proxy,
  timeout = 8000,
): Promise<ProxyCheckResult> {
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
    });

    const latency = Math.round(performance.now() - start);

    if (response.status >= 200 && response.status < 400) {
      return {
        proxy,
        status: "working",
        latency,
        speed: classifySpeed(latency),
        statusCode: response.status,
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      proxy,
      status: "dead",
      latency,
      statusCode: response.status,
      error: `HTTP ${response.status}`,
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
      status: "dead",
      latency,
      error: message,
      checkedAt: new Date().toISOString(),
    };
  }
}