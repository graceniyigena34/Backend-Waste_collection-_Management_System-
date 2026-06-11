import { pool } from "../config/db";
import crypto from "crypto";

export type UserRole = "citizen" | "waste_collector" | "admin";

export interface User {
  id: number;
  full_name: string;
  email: string;
  telephone: string;
  role: UserRole;
  password: string;
  created_at?: Date;
}

export const initUsersTable = async () => {
  // Create table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      telephone VARCHAR(20) NOT NULL DEFAULT '',
      role VARCHAR(20) NOT NULL DEFAULT 'citizen',
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Migration: add telephone column if it doesn't exist (handles existing tables)
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS telephone VARCHAR(20) NOT NULL DEFAULT ''
  `);

  // Password reset tokens table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Migration: enforce canonical role default and normalize common existing values.
  await pool.query(`
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'citizen'
  `);

  await pool.query(`
    UPDATE users
    SET role = CASE
      WHEN LOWER(REPLACE(REPLACE(role, '-', '_'), ' ', '_')) = 'waste_collector' THEN 'waste_collector'
      WHEN LOWER(role) = 'admin' THEN 'admin'
      ELSE 'citizen'
    END
  `);
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id: number): Promise<User | null> => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const createUser = async (
  full_name: string,
  email: string,
  telephone: string,
  role: UserRole,
  hashedPassword: string
): Promise<User> => {
  const result = await pool.query(
    "INSERT INTO users (full_name, email, telephone, role, password) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [full_name, email, telephone, role, hashedPassword]
  );
  return result.rows[0];
};

export const updateUser = async (
  id: number,
  fields: { full_name?: string; email?: string; telephone?: string; role?: UserRole; password?: string }
): Promise<User | null> => {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return findUserById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => fields[k]);

  const result = await pool.query(
    `UPDATE users SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
};

export const deleteUser = async (id: number): Promise<boolean> => {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const getAllUsers = async (): Promise<Omit<User, "password">[]> => {
  const result = await pool.query(
    "SELECT id, full_name, email, telephone, role, created_at FROM users ORDER BY created_at DESC"
  );
  return result.rows;
};

// ── Password reset tokens ────────────────────────────────────────────────────

export const createPasswordResetToken = async (userId: number): Promise<string> => {
  // Invalidate any existing unused tokens for this user
  await pool.query(
    "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
    [userId]
  );
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await pool.query(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  );
  return token;
};

export const verifyPasswordResetToken = async (token: string): Promise<number | null> => {
  const result = await pool.query(
    "SELECT user_id FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()",
    [token]
  );
  return result.rows[0]?.user_id ?? null;
};

export const invalidatePasswordResetToken = async (token: string): Promise<void> => {
  await pool.query("UPDATE password_reset_tokens SET used = TRUE WHERE token = $1", [token]);
};
