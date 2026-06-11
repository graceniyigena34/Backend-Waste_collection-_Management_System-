import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { initiateCashIn, getTransactionStatus, ping } from "../services/paypackService";
import {
  createPayment,
  updatePaymentStatus,
  getPaymentByPaypackRef,
  logPaypackEvent,
  PaymentStatus,
} from "../models/paymentModel";
import { getHouseholdByUserId } from "../models/householdModel";

const WEBHOOK_SECRET = process.env.PAYPACK_WEBHOOK_SECRET;

// POST /api/paypack/cashin — citizen initiates mobile money payment
export const cashIn = async (req: AuthRequest, res: Response): Promise<void> => {
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

  const safeAmount = Number(amount) || 3000;

  const result = await initiateCashIn(safeAmount, String(number));

  // Create payment record with Pending status
  const payment = await createPayment({
    user_id,
    household_id: household.id,
    amount: safeAmount,
    currency: "RWF",
    method: "Mobile Money",
    status: "Pending",
    month,
    description: description || "Monthly waste collection fee",
    transaction_ref: result.ref,
    paypack_ref: result.ref,
  });

  await logPaypackEvent(result.ref, "cashin_initiated", result, payment.id);

  res.status(201).json({ message: "Payment initiated", payment, paypack: result });
};

// GET /api/paypack/status/:ref — poll transaction status
export const transactionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const ref = Array.isArray(req.params.ref) ? req.params.ref[0] : req.params.ref;
  if (!ref) { res.status(400).json({ message: "ref is required" }); return; }

  const txn = await getTransactionStatus(ref);

  const statusMap: Record<string, PaymentStatus> = {
    successful: "Paid",
    failed: "Failed",
    pending: "Pending",
  };
  const rawStatus = Array.isArray(txn.status) ? txn.status[0] : (txn.status ?? "");
  const mapped: PaymentStatus = statusMap[rawStatus.toLowerCase()] ?? "Pending";

  if (mapped !== "Pending") {
    const payment = await getPaymentByPaypackRef(ref);
    if (payment && payment.status === "Pending") {
      const payDate = mapped === "Paid" ? new Date().toISOString().split("T")[0] : undefined;
      await updatePaymentStatus(payment.id, mapped, payDate, ref, ref);
      await logPaypackEvent(ref, `status_polled_${mapped.toLowerCase()}`, txn, payment.id);
    }
  }

  res.json({ ref, status: mapped, raw: txn });
};

// POST /api/paypack/webhook — Paypack pushes real-time updates
export const webhook = async (req: Request, res: Response): Promise<void> => {
  // Verify shared secret if configured
  if (WEBHOOK_SECRET) {
    const incoming = req.headers["x-paypack-secret"];
    const incomingStr = Array.isArray(incoming) ? incoming[0] : incoming;
    if (incomingStr !== WEBHOOK_SECRET) {
      res.status(401).json({ message: "Invalid webhook secret" });
      return;
    }
  }

  const { ref, status } = req.body ?? {};
  if (!ref || !status) { res.status(400).json({ message: "ref and status are required" }); return; }

  const refStr = String(ref);
  const statusStr = String(status).toLowerCase();

  const statusMap: Record<string, PaymentStatus> = {
    successful: "Paid",
    failed: "Failed",
    pending: "Pending",
  };
  const mapped: PaymentStatus = statusMap[statusStr] ?? "Pending";

  const payment = await getPaymentByPaypackRef(refStr);
  if (payment) {
    await updatePaymentStatus(
      payment.id,
      mapped,
      mapped === "Paid" ? new Date().toISOString().split("T")[0] : undefined,
      refStr,
      refStr
    );
    await logPaypackEvent(refStr, `webhook_${mapped.toLowerCase()}`, req.body, payment.id);
  } else {
    await logPaypackEvent(refStr, "webhook_unmatched", req.body);
  }

  res.json({ received: true });
};

// GET /api/paypack/ping — connectivity test
export const pingPaypack = async (_req: Request, res: Response): Promise<void> => {
  const result = await ping();
  res.json({ ok: true, paypack: result });
};
