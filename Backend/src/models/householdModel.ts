import { pool } from "../config/db";

export type HouseType = "RESIDENTIAL" | "APARTMENT" | "COMMERCIAL" | "VILLA";

export interface Household {
  id: number;
  user_id: number;
  district: string;
  sector: string;
  cell: string;
  village: string;
  street_address: string;
  house_type: HouseType;
  residents: number;
  notes?: string;
  zone?: string;
  status: "Active" | "Inactive" | "Suspended";
  created_at?: Date;
  updated_at?: Date;
}

export const initHouseholdsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS households (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      district VARCHAR(100) NOT NULL,
      sector VARCHAR(100) NOT NULL,
      cell VARCHAR(100) NOT NULL,
      village VARCHAR(100) NOT NULL,
      street_address VARCHAR(255) NOT NULL,
      house_type VARCHAR(20) NOT NULL DEFAULT 'RESIDENTIAL',
      residents INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      zone VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export const createHousehold = async (
  user_id: number,
  data: Omit<Household, "id" | "user_id" | "status" | "created_at" | "updated_at">
): Promise<Household> => {
  const result = await pool.query(
    `INSERT INTO households (user_id, district, sector, cell, village, street_address, house_type, residents, notes, zone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [user_id, data.district, data.sector, data.cell, data.village, data.street_address, data.house_type, data.residents, data.notes ?? null, data.zone ?? null]
  );
  return result.rows[0];
};

export const getHouseholdByUserId = async (user_id: number): Promise<Household | null> => {
  const result = await pool.query("SELECT * FROM households WHERE user_id = $1", [user_id]);
  return result.rows[0] || null;
};

export const getHouseholdById = async (id: number): Promise<Household | null> => {
  const result = await pool.query("SELECT * FROM households WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const updateHousehold = async (
  user_id: number,
  data: Partial<Omit<Household, "id" | "user_id" | "created_at">>
): Promise<Household | null> => {
  const keys = Object.keys(data) as (keyof typeof data)[];
  if (keys.length === 0) return getHouseholdByUserId(user_id);
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => data[k]);
  const result = await pool.query(
    `UPDATE households SET ${setClauses}, updated_at = NOW() WHERE user_id = $${keys.length + 1} RETURNING *`,
    [...values, user_id]
  );
  return result.rows[0] || null;
};

export const getAllHouseholds = async (): Promise<(Household & { full_name: string; email: string; telephone: string })[]> => {
  const result = await pool.query(`
    SELECT h.*, u.full_name, u.email, u.telephone
    FROM households h
    JOIN users u ON h.user_id = u.id
    ORDER BY h.created_at DESC
  `);
  return result.rows;
};
