import { pool } from "../config/db";

export interface CompanyDriver {
  id: number;
  company_id: number;
  name: string;
  phone: string;
  email?: string;
  license_number?: string;
  national_id?: string;
  years_of_experience?: number;
  status?: string;
  zone?: string;
  truck_id?: string;
  created_at?: Date;
}

export interface CompanyDriverWithCompany extends CompanyDriver {
  company_name?: string;
}

export const initCompanyDriversTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_drivers (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES waste_company_profiles(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(150),
      license_number VARCHAR(100),
      national_id VARCHAR(50),
      years_of_experience INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      zone VARCHAR(100),
      truck_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS company_drivers_company_id_idx ON company_drivers (company_id);
  `);
  // Migrate existing tables — add new columns if they don't exist
  await pool.query(`ALTER TABLE company_drivers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
  await pool.query(`ALTER TABLE company_drivers ADD COLUMN IF NOT EXISTS zone VARCHAR(100)`);
  await pool.query(`ALTER TABLE company_drivers ADD COLUMN IF NOT EXISTS truck_id VARCHAR(50)`);
};

export const getDriversByCompanyId = async (companyId: number): Promise<CompanyDriver[]> => {
  const result = await pool.query(
    `SELECT * FROM company_drivers WHERE company_id = $1 ORDER BY created_at ASC`,
    [companyId],
  );
  return result.rows;
};

export const getAllDrivers = async (): Promise<CompanyDriverWithCompany[]> => {
  const result = await pool.query(
    `SELECT cd.*, wcp.company_name
     FROM company_drivers cd
     LEFT JOIN waste_company_profiles wcp ON wcp.id = cd.company_id
     ORDER BY cd.created_at ASC`,
  );
  return result.rows;
};

export const createCompanyDriver = async (
  companyId: number,
  data: Omit<CompanyDriver, "id" | "company_id" | "created_at">,
): Promise<CompanyDriver> => {
  const result = await pool.query(
    `INSERT INTO company_drivers (company_id, name, phone, email, license_number, national_id, years_of_experience, status, zone, truck_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      companyId,
      data.name,
      data.phone,
      data.email ?? null,
      data.license_number ?? null,
      data.national_id ?? null,
      data.years_of_experience ?? 0,
      data.status ?? "active",
      data.zone ?? null,
      data.truck_id ?? null,
    ],
  );
  return result.rows[0];
};

export const updateCompanyDriver = async (
  companyId: number,
  driverId: number,
  data: Partial<Omit<CompanyDriver, "id" | "company_id" | "created_at">>,
): Promise<CompanyDriver | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone); }
  if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
  if (data.license_number !== undefined) { fields.push(`license_number = $${idx++}`); values.push(data.license_number); }
  if (data.national_id !== undefined) { fields.push(`national_id = $${idx++}`); values.push(data.national_id); }
  if (data.years_of_experience !== undefined) { fields.push(`years_of_experience = $${idx++}`); values.push(data.years_of_experience); }
  if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
  if (data.zone !== undefined) { fields.push(`zone = $${idx++}`); values.push(data.zone); }
  if (data.truck_id !== undefined) { fields.push(`truck_id = $${idx++}`); values.push(data.truck_id); }
  if (fields.length === 0) return null;
  values.push(companyId);
  const companyIdx = idx++;
  values.push(driverId);
  const driverIdx = idx;
  const result = await pool.query(
    `UPDATE company_drivers SET ${fields.join(", ")} WHERE company_id = $${companyIdx} AND id = $${driverIdx} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
};

export const deleteCompanyDriver = async (companyId: number, driverId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM company_drivers WHERE company_id = $1 AND id = $2`,
    [companyId, driverId],
  );
  return (result.rowCount ?? 0) > 0;
};
