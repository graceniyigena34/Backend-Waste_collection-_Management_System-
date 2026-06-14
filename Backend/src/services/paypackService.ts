const PAYPACK_BASE = "https://payments.paypack.rw";

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

  const res = await paypackFetch<{ access: string; refresh: string; expires: number }>(
    "/api/auth/agents/authorize",
    { method: "POST", body: JSON.stringify({ client_id: id, client_secret: secret }) }
  );

  // expires is a Unix timestamp in seconds; subtract 60s buffer to refresh before actual expiry
  tokenCache = { token: res.access, expiresAt: res.expires * 1000 - 60_000 };
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
    const txn = await paypackFetch<PaypackTxn>(
      `/api/transactions/find/${encodeURIComponent(ref)}`,
      { method: "GET", headers: { Authorization: `Bearer ${token}` } }
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
  try { await getToken(); return true; } catch { return false; }
}
