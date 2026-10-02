import type { Proxy, ProxyProtocol } from "./types.js";

export function parseProxy(input: string): Proxy {
  const [name, proxyString] = input.split("|");

  if (!name || !proxyString) {
    throw new Error(
      "Invalid format. Expected: ProxyName|host:port or ProxyName|user:password@host:port",
    );
  }

  const value = proxyString.trim();

  let protocol: ProxyProtocol = "http";
  let address = value;

  if (value.includes("://")) {
    const [scheme, rest] = value.split("://");

    if (
      scheme !== "http" &&
      scheme !== "https" &&
      scheme !== "socks4" &&
      scheme !== "socks5"
    ) {
      throw new Error(`Unsupported protocol: ${scheme}`);
    }

    protocol = scheme;
    address = rest;
  }

  let username: string | undefined;
  let password: string | undefined;
  let hostPort = address;

  if (address.includes("@")) {
    const [credentials, proxyAddress] = address.split("@");

    if (!credentials || !proxyAddress) {
      throw new Error("Invalid authenticated proxy format");
    }

    const colonIndex = credentials.indexOf(":");

    if (colonIndex === -1) {
      throw new Error("Invalid credentials format");
    }

    username = credentials.slice(0, colonIndex);
    password = credentials.slice(colonIndex + 1);
    hostPort = proxyAddress;
  }

  const parts = hostPort.split(":");

  if (parts.length !== 2) {
    throw new Error("Invalid proxy address. Expected host:port");
  }

  const host = parts[0];
  const port = Number(parts[1]);

  if (!host) {
    throw new Error("Missing proxy host");
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid proxy port");
  }

  return {
    name: name.trim(),
    host,
    port,
    protocol,
    username,
    password,
  };
}