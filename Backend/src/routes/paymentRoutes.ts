import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import {
  getMyPayments,
  getMyPaymentSummary,
  listAllPayments,
  makePayment,
  adminRecordPayment,
  patchPaymentStatus,
} from "../controllers/paymentController";

const router = Router();

/**
 * @swagger
 * /api/payments/me:
 *   get:
 *     summary: Get my payment history (Citizen)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments for the citizen
 */
router.get("/me", authenticate, getMyPayments);

/**
 * @swagger
 * /api/payments/me/summary:
 *   get:
 *     summary: Get my payment summary (Citizen)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment summary (paid count, pending, overdue, total paid)
 */
router.get("/me/summary", authenticate, getMyPaymentSummary);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All payments
 */
router.get("/", authenticate, authorizeAdmin, listAllPayments);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Make a payment (Citizen)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [month]
 *             properties:
 *               amount: { type: number, default: 3000 }
 *               method: { type: string, enum: [Mobile Money, Bank Transfer, Cash], default: "Mobile Money" }
 *               month: { type: string, example: "January 2025" }
 *               description: { type: string }
 *               transaction_ref: { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded
 */
router.post("/", authenticate, makePayment);

/**
 * @swagger
 * /api/payments/admin:
 *   post:
 *     summary: Record a payment for any household (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, month]
 *             properties:
 *               user_id: { type: integer }
 *               amount: { type: number }
 *               method: { type: string }
 *               month: { type: string }
 *               status: { type: string, enum: [Paid, Pending, Overdue, Failed] }
 *               description: { type: string }
 *               transaction_ref: { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded
 */
router.post("/admin", authenticate, authorizeAdmin, adminRecordPayment);

/**
 * @swagger
 * /api/payments/{id}/status:
 *   patch:
 *     summary: Update payment status (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Paid, Pending, Overdue, Failed] }
 *               payment_date: { type: string, format: date }
 *               transaction_ref: { type: string }
 *     responses:
 *       200:
 *         description: Payment status updated
 */
router.patch("/:id/status", authenticate, authorizeAdmin, patchPaymentStatus);

export default router;
