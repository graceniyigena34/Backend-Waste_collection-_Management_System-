import { pool } from "../config/db";

export interface CompanyVehicle {
  id: number;
  company_id: number;
  plate_number: string;
  model: string;
  year?: number;
  capacity?: number;
  insurance_number?: string;
  created_at?: Date;
}

export const initCompanyVehiclesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_vehicles (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES waste_company_profiles(id) ON DELETE CASCADE,
      plate_number VARCHAR(20) NOT NULL,
      model VARCHAR(100) NOT NULL,
      year INTEGER,
      capacity INTEGER,
      insurance_number VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS company_vehicles_company_id_idx ON company_vehicles (company_id);
  `);
};

export const getVehiclesByCompanyId = async (companyId: number): Promise<CompanyVehicle[]> => {
  const result = await pool.query(
    `SELECT * FROM company_vehicles WHERE company_id = $1 ORDER BY created_at ASC`,
    [companyId],
  );
  return result.rows;
};

export const createCompanyVehicle = async (
  companyId: number,
  data: Omit<CompanyVehicle, "id" | "company_id" | "created_at">,
): Promise<CompanyVehicle> => {
  const result = await pool.query(
    `INSERT INTO company_vehicles (company_id, plate_number, model, year, capacity, insurance_number)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [companyId, data.plate_number, data.model, data.year ?? null, data.capacity ?? null, data.insurance_number ?? null],
  );
  return result.rows[0];
};

export const deleteCompanyVehicle = async (companyId: number, vehicleId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM company_vehicles WHERE company_id = $1 AND id = $2`,
    [companyId, vehicleId],
  );
  return (result.rowCount ?? 0) > 0;
};
