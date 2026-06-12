import { pool } from "../config/db";

export interface CompanyAssignment {
  id: number;
  company_id: number;
  driver_id: number;
  vehicle_id: number;
  zone: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // JOINed
  driver_name?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
}

export const initAssignmentsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_assignments (
      id           SERIAL PRIMARY KEY,
      company_id   INTEGER NOT NULL REFERENCES waste_company_profiles(id) ON DELETE CASCADE,
      driver_id    INTEGER NOT NULL REFERENCES company_drivers(id) ON DELETE CASCADE,
      vehicle_id   INTEGER NOT NULL REFERENCES company_vehicles(id) ON DELETE CASCADE,
      zone         VARCHAR(150) NOT NULL,
      notes        TEXT,
      created_at   TIMESTAMP DEFAULT NOW(),
      updated_at   TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS company_assignments_company_id_idx ON company_assignments (company_id);
  `);
};

export const getAssignmentsByCompany = async (companyId: number): Promise<CompanyAssignment[]> => {
  const result = await pool.query(
    `SELECT ca.*,
            cd.name           AS driver_name,
            cv.plate_number   AS vehicle_plate,
            cv.model          AS vehicle_model
     FROM   company_assignments ca
     JOIN   company_drivers  cd ON cd.id = ca.driver_id
     JOIN   company_vehicles cv ON cv.id = ca.vehicle_id
     WHERE  ca.company_id = $1
     ORDER  BY ca.created_at DESC`,
    [companyId],
  );
  return result.rows;
};

export const createAssignment = async (
  companyId: number,
  driverId: number,
  vehicleId: number,
  zone: string,
  notes?: string,
): Promise<CompanyAssignment> => {
  const result = await pool.query(
    `INSERT INTO company_assignments (company_id, driver_id, vehicle_id, zone, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [companyId, driverId, vehicleId, zone, notes ?? null],
  );
  const row: CompanyAssignment = result.rows[0];
  // Return with driver/vehicle names via a second query (keeps insert clean)
  const full = await pool.query(
    `SELECT ca.*,
            cd.name           AS driver_name,
            cv.plate_number   AS vehicle_plate,
            cv.model          AS vehicle_model
     FROM   company_assignments ca
     JOIN   company_drivers  cd ON cd.id = ca.driver_id
     JOIN   company_vehicles cv ON cv.id = ca.vehicle_id
     WHERE  ca.id = $1`,
    [row.id],
  );
  return full.rows[0];
};

export const updateAssignment = async (
  companyId: number,
  assignmentId: number,
  data: { driver_id?: number; vehicle_id?: number; zone?: string; notes?: string },
): Promise<CompanyAssignment | null> => {
  const fields: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;
  if (data.driver_id  !== undefined) { fields.push(`driver_id  = $${idx++}`); values.push(data.driver_id); }
  if (data.vehicle_id !== undefined) { fields.push(`vehicle_id = $${idx++}`); values.push(data.vehicle_id); }
  if (data.zone       !== undefined) { fields.push(`zone       = $${idx++}`); values.push(data.zone); }
  if (data.notes      !== undefined) { fields.push(`notes      = $${idx++}`); values.push(data.notes); }
  values.push(companyId, assignmentId);
  const result = await pool.query(
    `UPDATE company_assignments SET ${fields.join(", ")}
     WHERE  company_id = $${idx} AND id = $${idx + 1}
     RETURNING id`,
    values,
  );
  if (!result.rows[0]) return null;
  const full = await pool.query(
    `SELECT ca.*,
            cd.name           AS driver_name,
            cv.plate_number   AS vehicle_plate,
            cv.model          AS vehicle_model
     FROM   company_assignments ca
     JOIN   company_drivers  cd ON cd.id = ca.driver_id
     JOIN   company_vehicles cv ON cv.id = ca.vehicle_id
     WHERE  ca.id = $1`,
    [result.rows[0].id],
  );
  return full.rows[0] ?? null;
};

export const deleteAssignment = async (companyId: number, assignmentId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM company_assignments WHERE company_id = $1 AND id = $2`,
    [companyId, assignmentId],
  );
  return (result.rowCount ?? 0) > 0;
};
