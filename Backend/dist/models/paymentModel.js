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
exports.getPaymentSummaryByUserId = exports.updatePaymentStatus = exports.getAllPayments = exports.getPaymentsByUserId = exports.createPayment = exports.initPaymentsTable = void 0;
const db_1 = require("../config/db");
const initPaymentsTable = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      amount NUMERIC(10,2) NOT NULL DEFAULT 3000,
      currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
      method VARCHAR(30) NOT NULL DEFAULT 'Mobile Money',
      status VARCHAR(20) NOT NULL DEFAULT 'Pending',
      month VARCHAR(30) NOT NULL,
      payment_date DATE,
      description VARCHAR(255) NOT NULL DEFAULT 'Monthly waste collection fee',
      transaction_ref VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
});
exports.initPaymentsTable = initPaymentsTable;
const createPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const result = yield db_1.pool.query(`INSERT INTO payments (user_id, household_id, amount, currency, method, status, month, payment_date, description, transaction_ref)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [data.user_id, data.household_id, data.amount, data.currency, data.method, data.status, data.month, (_a = data.payment_date) !== null && _a !== void 0 ? _a : null, data.description, (_b = data.transaction_ref) !== null && _b !== void 0 ? _b : null]);
    return result.rows[0];
});
exports.createPayment = createPayment;
const getPaymentsByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC", [user_id]);
    return result.rows;
});
exports.getPaymentsByUserId = getPaymentsByUserId;
const getAllPayments = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`
    SELECT p.*, u.full_name, h.zone
    FROM payments p
    JOIN users u ON p.user_id = u.id
    JOIN households h ON p.household_id = h.id
    ORDER BY p.created_at DESC
  `);
    return result.rows;
});
exports.getAllPayments = getAllPayments;
const updatePaymentStatus = (id, status, payment_date, transaction_ref) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("UPDATE payments SET status = $1, payment_date = $2, transaction_ref = $3 WHERE id = $4 RETURNING *", [status, payment_date !== null && payment_date !== void 0 ? payment_date : null, transaction_ref !== null && transaction_ref !== void 0 ? transaction_ref : null, id]);
    return result.rows[0] || null;
});
exports.updatePaymentStatus = updatePaymentStatus;
const getPaymentSummaryByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'Paid') AS paid_count,
      COUNT(*) FILTER (WHERE status = 'Pending') AS pending_count,
      COUNT(*) FILTER (WHERE status = 'Overdue') AS overdue_count,
      COALESCE(SUM(amount) FILTER (WHERE status = 'Paid'), 0) AS total_paid
    FROM payments WHERE user_id = $1
  `, [user_id]);
    return result.rows[0];
});
exports.getPaymentSummaryByUserId = getPaymentSummaryByUserId;
