import { pool } from "../config/db";

export type PaymentStatus = "Paid" | "Pending" | "Overdue" | "Failed";
export type PaymentMethod = "Mobile Money" | "Bank Transfer" | "Cash";

export interface Payment {
  id: number;
  user_id: number;
  household_id: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  month: string;
  payment_date?: string;
  description: string;
  transaction_ref?: string;
  created_at?: Date;
}

export const initPaymentsTable = async () => {
  await pool.query(`
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
};

export const createPayment = async (
  data: Omit<Payment, "id" | "created_at">
): Promise<Payment> => {
  const result = await pool.query(
    `INSERT INTO payments (user_id, household_id, amount, currency, method, status, month, payment_date, description, transaction_ref)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [data.user_id, data.household_id, data.amount, data.currency, data.method, data.status, data.month, data.payment_date ?? null, data.description, data.transaction_ref ?? null]
  );
  return result.rows[0];
};

export const getPaymentsByUserId = async (user_id: number): Promise<Payment[]> => {
  const result = await pool.query(
    "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC",
    [user_id]
  );
  return result.rows;
};

export const getAllPayments = async (): Promise<(Payment & { full_name: string; zone: string })[]> => {
  const result = await pool.query(`
    SELECT p.*, u.full_name, h.zone
    FROM payments p
    JOIN users u ON p.user_id = u.id
    JOIN households h ON p.household_id = h.id
    ORDER BY p.created_at DESC
  `);
  return result.rows;
};

export const updatePaymentStatus = async (
  id: number,
  status: PaymentStatus,
  payment_date?: string,
  transaction_ref?: string
): Promise<Payment | null> => {
  const result = await pool.query(
    "UPDATE payments SET status = $1, payment_date = $2, transaction_ref = $3 WHERE id = $4 RETURNING *",
    [status, payment_date ?? null, transaction_ref ?? null, id]
  );
  return result.rows[0] || null;
};

export const getPaymentSummaryByUserId = async (user_id: number) => {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'Paid') AS paid_count,
      COUNT(*) FILTER (WHERE status = 'Pending') AS pending_count,
      COUNT(*) FILTER (WHERE status = 'Overdue') AS overdue_count,
      COALESCE(SUM(amount) FILTER (WHERE status = 'Paid'), 0) AS total_paid
    FROM payments WHERE user_id = $1
  `, [user_id]);
  return result.rows[0];
};
