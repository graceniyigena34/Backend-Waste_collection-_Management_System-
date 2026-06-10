import https from "https";

const BASE_URL = "https://api.paypack.rw";

const CLIENT_ID = process.env.PAYPACK_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPACK_CLIENT_SECRET;

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function jsonRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  authToken?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload).toString();

    const url = new URL(path, BASE_URL);
    const req = https.request(
      { hostname: url.hostname, path: url.pathname + url.search, method, headers },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(parsed?.message || `Paypack error ${res.statusCode}`));
            }
            resolve(parsed as T);
          } catch {
            reject(new Error("Invalid JSON from Paypack"));
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("PAYPACK_CLIENT_ID and PAYPACK_CLIENT_SECRET must be set in .env");
  }
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const res = await jsonRequest<{ access: string; refresh: string }>("POST", "/api/auth/agents/authorize", {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  // Paypack tokens expire in ~24h; cache for 23h
  tokenCache = { token: res.access, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return res.access;
}

export interface CashInResult {
  ref: string;
  status: string;
  amount: number;
  number: string;
}

export async function initiateCashIn(
  amount: number,
  number: string
): Promise<CashInResult> {
  const token = await getAccessToken();
  const res = await jsonRequest<CashInResult>("POST", "/api/transactions/cashin", { amount, number }, token);
  return res;
}

export interface TransactionStatus {
  ref: string;
  status: string; // "successful" | "pending" | "failed"
  amount: number;
  number: string;
  kind: string;
  created_at: string;
  updated_at: string;
}

export async function getTransactionStatus(ref: string): Promise<TransactionStatus> {
  const token = await getAccessToken();
  return jsonRequest<TransactionStatus>("GET", `/api/transactions/find/${encodeURIComponent(ref)}`, undefined, token);
}

export async function ping(): Promise<{ message: string }> {
  return jsonRequest<{ message: string }>("GET", "/");
}
