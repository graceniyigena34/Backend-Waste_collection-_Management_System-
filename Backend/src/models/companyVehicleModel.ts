import { pool } from "../config/db";

export interface CompanyVehicle {
  id: number;
  company_id: number;
  plate_number: string;
  model: string;
  year?: string;
  capacity?: string;
  assigned_zone?: string;
  insurance_number?: string;
  status?: string;
  created_at?: Date;
}

export const initCompanyVehiclesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_vehicles (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES waste_company_profiles(id) ON DELETE CASCADE,
      plate_number VARCHAR(50) NOT NULL,
      model VARCHAR(100) NOT NULL,
      year VARCHAR(10),
      capacity VARCHAR(50),
      insurance_number VARCHAR(100),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS company_vehicles_company_id_idx ON company_vehicles (company_id);
  `);
  await pool.query(`ALTER TABLE company_vehicles ADD COLUMN IF NOT EXISTS assigned_zone VARCHAR(100)`);
  await pool.query(`ALTER TABLE company_vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
  // Alter year and capacity to VARCHAR if they are still INTEGER
  await pool.query(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'company_vehicles' AND column_name = 'year' AND data_type = 'integer'
      ) THEN
        ALTER TABLE company_vehicles ALTER COLUMN year TYPE VARCHAR(10) USING year::VARCHAR;
      END IF;
    END $$;
  `);
  await pool.query(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'company_vehicles' AND column_name = 'capacity' AND data_type = 'integer'
      ) THEN
        ALTER TABLE company_vehicles ALTER COLUMN capacity TYPE VARCHAR(50) USING capacity::VARCHAR;
      END IF;
    END $$;
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
    `INSERT INTO company_vehicles (company_id, plate_number, model, year, capacity, assigned_zone, insurance_number, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [companyId, data.plate_number, data.model, data.year ?? null, data.capacity ?? null,
     data.assigned_zone ?? null, data.insurance_number ?? null, data.status ?? "active"],
  );
  return result.rows[0];
};

export const updateCompanyVehicle = async (
  companyId: number,
  vehicleId: number,
  data: Partial<Omit<CompanyVehicle, "id" | "company_id" | "created_at">>,
): Promise<CompanyVehicle | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (data.plate_number !== undefined) { fields.push(`plate_number = $${idx++}`); values.push(data.plate_number); }
  if (data.model !== undefined) { fields.push(`model = $${idx++}`); values.push(data.model); }
  if (data.year !== undefined) { fields.push(`year = $${idx++}`); values.push(data.year); }
  if (data.capacity !== undefined) { fields.push(`capacity = $${idx++}`); values.push(data.capacity); }
  if (data.assigned_zone !== undefined) { fields.push(`assigned_zone = $${idx++}`); values.push(data.assigned_zone); }
  if (data.insurance_number !== undefined) { fields.push(`insurance_number = $${idx++}`); values.push(data.insurance_number); }
  if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
  if (fields.length === 0) return null;
  values.push(companyId);
  const companyIdx = idx++;
  values.push(vehicleId);
  const vehicleIdx = idx;
  const result = await pool.query(
    `UPDATE company_vehicles SET ${fields.join(", ")} WHERE company_id = $${companyIdx} AND id = $${vehicleIdx} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
};

export const deleteCompanyVehicle = async (companyId: number, vehicleId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM company_vehicles WHERE company_id = $1 AND id = $2`,
    [companyId, vehicleId],
  );
  return (result.rowCount ?? 0) > 0;
};
