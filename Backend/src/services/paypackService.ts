import https from "https";
import http from "http";

const PAYPACK_BASE = "https://payments.paypack.rw";

interface TokenCache {
  token: string;
  expiresAt: number;
}
let tokenCache: TokenCache | null = null;

function request<T>(method: string, urlStr: string, body?: unknown, token?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const url = new URL(urlStr);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (payload) headers["Content-Length"] = String(Buffer.byteLength(payload));

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            if ((res.statusCode ?? 0) >= 400) {
              return reject(new Error(parsed?.message || `Paypack HTTP ${res.statusCode}`));
            }
            resolve(parsed as T);
          } catch {
            reject(new Error(`Paypack non-JSON response (${res.statusCode}): ${raw.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getToken(): Promise<string> {
  const id = process.env.PAYPACK_CLIENT_ID;
  const secret = process.env.PAYPACK_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPACK_CLIENT_ID and PAYPACK_CLIENT_SECRET must be set in .env");

  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const res = await request<{ access: string; refresh: string; expires: number }>(
    "POST",
    `${PAYPACK_BASE}/api/auth/agents/authorize`,
    { client_id: id, client_secret: secret }
  );

  // expires is a Unix timestamp in seconds; subtract 60s buffer to refresh before actual expiry
  tokenCache = { token: res.access, expiresAt: res.expires * 1000 - 60_000 };
  console.log("[Paypack] Token refreshed");
  return res.access;
}

export interface CashInResult {
  ref: string;
  status: string;
  amount: number;
  number: string;
}

export async function initiateCashIn(amount: number, number: string): Promise<CashInResult> {
  const token = await getToken();
  const result = await request<CashInResult>(
    "POST",
    `${PAYPACK_BASE}/api/transactions/cashin`,
    { amount, number },
    token
  );
  console.log(`[Paypack] Cash In initiated: ref=${result.ref} amount=${amount} number=${number}`);
  return result;
}

export interface TransactionStatus {
  ref: string;
  status: string;
  amount: number;
  number: string;
  kind: string;
  created_at: string;
  updated_at: string;
}

interface PaypackTxn {
  ref: string;
  amount: number;
  fee: number;
  kind: string;
  provider: string;
  client: string;
  timestamp: string;
}

export async function getTransactionStatus(ref: string): Promise<TransactionStatus> {
  const token = await getToken();
  try {
    const txn = await request<PaypackTxn>(
      "GET",
      `${PAYPACK_BASE}/api/transactions/find/${encodeURIComponent(ref)}`,
      undefined,
      token
    );
    // Paypack returns no status field — existence of the record means it was processed successfully
    return {
      ref: txn.ref,
      status: "successful",
      amount: txn.amount,
      number: txn.client,
      kind: txn.kind,
      created_at: txn.timestamp,
      updated_at: txn.timestamp,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("not found")) {
      return { ref, status: "pending", amount: 0, number: "", kind: "CASHIN", created_at: "", updated_at: "" };
    }
    throw err;
  }
}

export async function pingPaypackAPI(): Promise<boolean> {
  try {
    await getToken();
    return true;
  } catch {
    return false;
  }
}
