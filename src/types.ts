export type ProxyProtocol =
  | "http"
  | "https"
  | "socks4"
  | "socks5";

export type ProxyStatus =
  | "pending"
  | "checking"
  | "working"
  | "dead";

export type ProxySpeed =
  | "fast"
  | "good"
  | "slow"
  | "very-slow";

export interface Proxy {
  name: string;
  host: string;
  port: number;
  protocol: ProxyProtocol;
  username?: string;
  password?: string;
}

export interface ProxyCheckResult {
  proxy: Proxy;
  status: ProxyStatus;
  latency?: number;
  speed?: ProxySpeed;
  statusCode?: number;
  error?: string;
  checkedAt: string;
}