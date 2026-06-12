// api.paypack.rw has no public DNS outside Rwanda.
// IP 213.188.209.3 (fly.io Johannesburg) is resolved via paypack.rw's A record.
// We patch the global DNS lookup so Node resolves api.paypack.rw → that IP.
import dns from "dns";

const PAYPACK_IP = "213.188.209.3";
const PAYPACK_BASE = "https://api.paypack.rw";

// Patch DNS so api.paypack.rw resolves to the known IP
const originalLookup = dns.lookup;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(dns as any).lookup = (hostname: string, ...args: unknown[]) => {
  if (hostname === "api.paypack.rw") {
    const cb = args[args.length - 1] as (err: null, addr: string, fam: number) => void;
    return cb(null, PAYPACK_IP, 4);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (originalLookup as any)(hostname, ...args);
};

interface TokenCache { token: string; expiresAt: number; }
let tokenCache: TokenCache | null = null;

async function paypackFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PAYPACK_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!text) throw new Error(`Paypack returned empty response (${res.status})`);
  let json: T;
  try { json = JSON.parse(text) as T; } catch { throw new Error(`Paypack non-JSON: ${text.slice(0, 200)}`); }
  if (res.status >= 400) throw new Error((json as { message?: string }).message || `Paypack HTTP ${res.status}`);
  return json;
}

async function getToken(): Promise<string> {
  const id = process.env.PAYPACK_CLIENT_ID;
  const secret = process.env.PAYPACK_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPACK_CLIENT_ID and PAYPACK_CLIENT_SECRET must be set");

  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const res = await paypackFetch<{ access: string; refresh: string }>(
    "/api/auth/agents/authorize",
    { method: "POST", body: JSON.stringify({ client_id: id, client_secret: secret }) }
  );

  tokenCache = { token: res.access, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  console.log("[Paypack] Token refreshed");
  return res.access;
}

export interface CashInResult { ref: string; status: string; amount: number; number: string; }

export async function initiateCashIn(amount: number, number: string): Promise<CashInResult> {
  const token = await getToken();
  const result = await paypackFetch<CashInResult>(
    "/api/transactions/cashin",
    { method: "POST", body: JSON.stringify({ amount, number }), headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(`[Paypack] CashIn initiated: ref=${result.ref} amount=${amount} number=${number}`);
  return result;
}

export interface TransactionStatus {
  ref: string; status: string; amount: number; number: string;
  kind: string; created_at: string; updated_at: string;
}

export async function getTransactionStatus(ref: string): Promise<TransactionStatus> {
  const token = await getToken();
  return paypackFetch<TransactionStatus>(
    `/api/transactions/find/${encodeURIComponent(ref)}`,
    { method: "GET", headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function pingPaypackAPI(): Promise<boolean> {
  try { await getToken(); return true; } catch { return false; }
}
