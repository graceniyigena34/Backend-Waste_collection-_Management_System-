import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createPayment,
  getPaymentsByUserId,
  getAllPayments,
  updatePaymentStatus,
  getPaymentSummaryByUserId,
  PaymentStatus,
  PaymentMethod,
} from "../models/paymentModel";
import { getHouseholdByUserId } from "../models/householdModel";

const PAYPACK_BASE = "https://api.paypack.rw";
let _tokenCache: { token: string; expiresAt: number } | null = null;

async function getPaypackToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) return _tokenCache.token;
  const res = await fetch(`${PAYPACK_BASE}/api/auth/agents/authorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PAYPACK_CLIENT_ID,
      client_secret: process.env.PAYPACK_CLIENT_SECRET,
    }),
  });
  const data = await res.json() as { access: string };
  if (!res.ok) throw new Error((data as unknown as { message: string }).message || `Paypack auth ${res.status}`);
  _tokenCache = { token: data.access, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return data.access;
}

const VALID_STATUSES: PaymentStatus[] = ["Paid", "Pending", "Overdue", "Failed"];
const VALID_METHODS: PaymentMethod[] = ["Mobile Money", "Bank Transfer", "Cash"];

// GET /api/payments/me — citizen gets their payments
export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const payments = await getPaymentsByUserId(req.user!.id);
  res.json(payments);
};

// GET /api/payments/me/summary — citizen gets payment summary
export const getMyPaymentSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const summary = await getPaymentSummaryByUserId(req.user!.id);
  res.json(summary);
};

// GET /api/payments — Admin: get all payments
export const listAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const payments = await getAllPayments();
  res.json(payments);
};

// POST /api/payments — Citizen initiates a payment
export const makePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user!.id;
  const { amount, method, month, description, transaction_ref } = req.body;

  if (!month) {
    res.status(400).json({ message: "month is required (e.g. January 2025)" });
    return;
  }

  const household = await getHouseholdByUserId(user_id);
  if (!household) {
    res.status(404).json({ message: "Household not found. Complete your profile first." });
    return;
  }

  const safeMethod: PaymentMethod = VALID_METHODS.includes(method) ? method : "Mobile Money";

  const payment = await createPayment({
    user_id,
    household_id: household.id,
    amount: Number(amount) || 3000,
    currency: "RWF",
    method: safeMethod,
    status: "Paid",
    month,
    payment_date: new Date().toISOString().split("T")[0],
    description: description || "Monthly waste collection fee",
    transaction_ref: transaction_ref || `TXN-${Date.now()}`,
  });

  res.status(201).json({ message: "Payment recorded successfully", payment });
};

// POST /api/payments/admin — Admin records a payment for any household
export const adminRecordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { user_id, amount, method, month, status, description, transaction_ref } = req.body;

  if (!user_id || !month) {
    res.status(400).json({ message: "user_id and month are required" });
    return;
  }

  const household = await getHouseholdByUserId(Number(user_id));
  if (!household) {
    res.status(404).json({ message: "Household not found for this user" });
    return;
  }

  const safeMethod: PaymentMethod = VALID_METHODS.includes(method) ? method : "Mobile Money";
  const safeStatus: PaymentStatus = VALID_STATUSES.includes(status) ? status : "Paid";

  const payment = await createPayment({
    user_id: Number(user_id),
    household_id: household.id,
    amount: Number(amount) || 3000,
    currency: "RWF",
    method: safeMethod,
    status: safeStatus,
    month,
    payment_date: new Date().toISOString().split("T")[0],
    description: description || "Monthly waste collection fee",
    transaction_ref: transaction_ref || `TXN-${Date.now()}`,
  });

  res.status(201).json({ message: "Payment recorded", payment });
};

// POST /api/payments/cashin — Citizen initiates mobile money payment via Paypack
export const cashinPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user!.id;
  const { number, month, amount } = req.body;

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

  let paypackResult: { ref: string; status: string; amount: number; number: string };
  try {
    const token = await getPaypackToken();
    const paypackRes = await fetch(`${PAYPACK_BASE}/api/transactions/cashin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: safeAmount, number }),
    });
    const paypackData = await paypackRes.json() as { ref: string; status: string; amount: number; number: string; message?: string };
    if (!paypackRes.ok) throw new Error(paypackData.message || `Paypack error ${paypackRes.status}`);
    paypackResult = paypackData;
  } catch (err) {
    res.status(502).json({ message: `Paypack error: ${err instanceof Error ? err.message : err}` });
    return;
  }

  const payment = await createPayment({
    user_id,
    household_id: household.id,
    amount: safeAmount,
    currency: "RWF",
    method: "Mobile Money",
    status: "Pending",
    month,
    description: "Monthly waste collection fee",
    transaction_ref: paypackResult.ref,
    paypack_ref: paypackResult.ref,
  });

  res.status(201).json({ message: "Payment initiated", payment, paypack: paypackResult });
};

// PATCH /api/payments/:id/status — Admin updates payment status
export const patchPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { status, payment_date, transaction_ref } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  const updated = await updatePaymentStatus(id, status, payment_date, transaction_ref);
  if (!updated) {
    res.status(404).json({ message: "Payment not found" });
    return;
  }
  res.json({ message: "Payment status updated", payment: updated });
};
