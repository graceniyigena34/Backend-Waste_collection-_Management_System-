"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
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
router.get("/me", auth_1.authenticate, paymentController_1.getMyPayments);
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
router.get("/me/summary", auth_1.authenticate, paymentController_1.getMyPaymentSummary);
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
router.get("/", auth_1.authenticate, auth_1.authorizeAdmin, paymentController_1.listAllPayments);
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
router.post("/", auth_1.authenticate, paymentController_1.makePayment);
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
router.post("/admin", auth_1.authenticate, auth_1.authorizeAdmin, paymentController_1.adminRecordPayment);
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
router.patch("/:id/status", auth_1.authenticate, auth_1.authorizeAdmin, paymentController_1.patchPaymentStatus);
exports.default = router;
