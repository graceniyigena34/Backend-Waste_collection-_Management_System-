import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { initiateCashIn, getTransactionStatus, pingPaypackAPI } from "../services/paypackService";
import {
  createPayment,
  updatePaymentStatus,
  getPaymentByPaypackRef,
  logPaypackEvent,
  PaymentStatus,
} from "../models/paymentModel";
import { getHouseholdByUserId } from "../models/householdModel";

const STATUS_MAP: Record<string, PaymentStatus> = {
  successful: "Paid",
  failed: "Failed",
  pending: "Pending",
};

function mapStatus(raw: string): PaymentStatus {
  return STATUS_MAP[String(raw).toLowerCase()] ?? "Pending";
}

function toStr(v: unknown): string {
  return Array.isArray(v) ? String(v[0]) : String(v ?? "");
}

// POST /api/paypack/cashin
export const cashIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user_id = req.user!.id;
    const { amount, number, month, description } = req.body;

    if (!number || !month) {
      res.status(400).json({ message: "number and month are required" });
      return;
    }

    const household = await getHouseholdByUserId(user_id);
    if (!household) {
      res.status(404).json({ message: "Household not found. Complete your profile first." });
      return;
    }

    const safeAmount = Math.max(100, Number(amount) || 3000);

    const result = await initiateCashIn(safeAmount, String(number));

    const payment = await createPayment({
      user_id,
      household_id: household.id,
      amount: safeAmount,
      currency: "RWF",
      method: "Mobile Money",
      status: "Pending",
      month: String(month),
      description: description ? String(description) : "Monthly waste collection fee",
      transaction_ref: result.ref,
      paypack_ref: result.ref,
    });

    await logPaypackEvent(result.ref, "cashin_initiated", result, payment.id);

    res.status(201).json({ message: "Payment initiated. Check your phone to confirm.", payment, paypack: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to initiate payment";
    console.error("[Paypack] cashIn error:", msg);
    res.status(502).json({ message: msg });
  }
};

// GET /api/paypack/status/:ref
export const transactionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ref = toStr(req.params.ref);
    if (!ref) { res.status(400).json({ message: "ref is required" }); return; }

    const txn = await getTransactionStatus(ref);
    const mapped = mapStatus(toStr(txn.status));

    if (mapped !== "Pending") {
      const payment = await getPaymentByPaypackRef(ref);
      if (payment && payment.status === "Pending") {
        const payDate = mapped === "Paid" ? new Date().toISOString().split("T")[0] : undefined;
        await updatePaymentStatus(payment.id, mapped, payDate, ref, ref);
        await logPaypackEvent(ref, `status_polled_${mapped.toLowerCase()}`, txn, payment.id);
        console.log(`[Paypack] Payment ${payment.id} updated to ${mapped} via polling`);
      }
    }

    res.json({ ref, status: mapped, raw: txn });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch status";
    console.error("[Paypack] transactionStatus error:", msg);
    res.status(502).json({ message: msg });
  }
};

// GET /api/paypack/webhook — Paypack sends a GET to verify the URL is reachable
// HEAD /api/paypack/webhook — some verifiers use HEAD
export const webhookVerify = (_req: Request, res: Response): void => {
  res.status(200).json({ message: "Webhook endpoint is active" });
};

// POST /api/paypack/webhook — Paypack pushes transaction events
export const webhookReceive = async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = process.env.PAYPACK_WEBHOOK_SECRET;
    if (secret) {
      const incoming = toStr(req.headers["x-paypack-secret"]);
      if (incoming !== secret) {
        console.warn("[Paypack] Webhook rejected: invalid secret");
        res.status(401).json({ message: "Invalid webhook secret" });
        return;
      }
    }

    const body = req.body ?? {};
    const ref = toStr(body.ref);
    const status = toStr(body.status);

    if (!ref || !status) {
      res.status(400).json({ message: "ref and status are required" });
      return;
    }

    const mapped = mapStatus(status);
    const payment = await getPaymentByPaypackRef(ref);

    if (payment) {
      if (payment.status !== mapped) {
        const payDate = mapped === "Paid" ? new Date().toISOString().split("T")[0] : undefined;
        await updatePaymentStatus(payment.id, mapped, payDate, ref, ref);
        console.log(`[Paypack] Webhook: payment ${payment.id} → ${mapped}`);
      }
      await logPaypackEvent(ref, `webhook_${mapped.toLowerCase()}`, body, payment.id);
    } else {
      console.warn(`[Paypack] Webhook: no payment found for ref=${ref}`);
      await logPaypackEvent(ref, "webhook_unmatched", body);
    }

    res.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("[Paypack] webhookReceive error:", msg);
    res.status(500).json({ message: msg });
  }
};

// GET /api/paypack/ping
export const ping = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ok = await pingPaypackAPI();
    res.json({ ok, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    res.status(502).json({ ok: false, message: err instanceof Error ? err.message : "Ping failed" });
  }
};
