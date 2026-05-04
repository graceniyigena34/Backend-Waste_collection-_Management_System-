"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchPaymentStatus = exports.adminRecordPayment = exports.makePayment = exports.listAllPayments = exports.getMyPaymentSummary = exports.getMyPayments = void 0;
const paymentModel_1 = require("../models/paymentModel");
const householdModel_1 = require("../models/householdModel");
const VALID_STATUSES = ["Paid", "Pending", "Overdue", "Failed"];
const VALID_METHODS = ["Mobile Money", "Bank Transfer", "Cash"];
// GET /api/payments/me — citizen gets their payments
const getMyPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payments = yield (0, paymentModel_1.getPaymentsByUserId)(req.user.id);
    res.json(payments);
});
exports.getMyPayments = getMyPayments;
// GET /api/payments/me/summary — citizen gets payment summary
const getMyPaymentSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const summary = yield (0, paymentModel_1.getPaymentSummaryByUserId)(req.user.id);
    res.json(summary);
});
exports.getMyPaymentSummary = getMyPaymentSummary;
// GET /api/payments — Admin: get all payments
const listAllPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payments = yield (0, paymentModel_1.getAllPayments)();
    res.json(payments);
});
exports.listAllPayments = listAllPayments;
// POST /api/payments — Citizen initiates a payment
const makePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_id = req.user.id;
    const { amount, method, month, description, transaction_ref } = req.body;
    if (!month) {
        res.status(400).json({ message: "month is required (e.g. January 2025)" });
        return;
    }
    const household = yield (0, householdModel_1.getHouseholdByUserId)(user_id);
    if (!household) {
        res.status(404).json({ message: "Household not found. Complete your profile first." });
        return;
    }
    const safeMethod = VALID_METHODS.includes(method) ? method : "Mobile Money";
    const payment = yield (0, paymentModel_1.createPayment)({
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
});
exports.makePayment = makePayment;
// POST /api/payments/admin — Admin records a payment for any household
const adminRecordPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, amount, method, month, status, description, transaction_ref } = req.body;
    if (!user_id || !month) {
        res.status(400).json({ message: "user_id and month are required" });
        return;
    }
    const household = yield (0, householdModel_1.getHouseholdByUserId)(Number(user_id));
    if (!household) {
        res.status(404).json({ message: "Household not found for this user" });
        return;
    }
    const safeMethod = VALID_METHODS.includes(method) ? method : "Mobile Money";
    const safeStatus = VALID_STATUSES.includes(status) ? status : "Paid";
    const payment = yield (0, paymentModel_1.createPayment)({
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
});
exports.adminRecordPayment = adminRecordPayment;
// PATCH /api/payments/:id/status — Admin updates payment status
const patchPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const { status, payment_date, transaction_ref } = req.body;
    if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
        return;
    }
    const updated = yield (0, paymentModel_1.updatePaymentStatus)(id, status, payment_date, transaction_ref);
    if (!updated) {
        res.status(404).json({ message: "Payment not found" });
        return;
    }
    res.json({ message: "Payment status updated", payment: updated });
});
exports.patchPaymentStatus = patchPaymentStatus;
