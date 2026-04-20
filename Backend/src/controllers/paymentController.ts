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
