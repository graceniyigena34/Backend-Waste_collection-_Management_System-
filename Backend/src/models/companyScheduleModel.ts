import { pool } from "../config/db";

export type CompanyScheduleStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled";

export interface CompanySchedule {
  id: number;
  company_id: number;
  district_id?: string;
  district_name?: string;
  schedule_date: string;
  day: string;
  sector_id?: string;
  sector_name?: string;
  cells: string[];
  driver?: string;
  vehicle?: string;
  start_time?: string;
  waste_type: string;
  status: CompanyScheduleStatus;
  published: boolean;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const initCompanySchedulesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_schedules (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES waste_company_profiles(id) ON DELETE CASCADE,
      district_id VARCHAR(100),
      district_name VARCHAR(150),
      schedule_date DATE NOT NULL,
      day VARCHAR(20) NOT NULL,
      sector_id VARCHAR(100),
      sector_name VARCHAR(150),
      cells JSONB DEFAULT '[]'::jsonb,
      driver VARCHAR(150),
      vehicle VARCHAR(150),
      start_time VARCHAR(20),
      waste_type VARCHAR(50) NOT NULL DEFAULT 'General Waste',
      status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS district_id VARCHAR(100);
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS district_name VARCHAR(150);
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS schedule_date DATE;
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS sector_id VARCHAR(100);
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS sector_name VARCHAR(150);
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS cells JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS driver VARCHAR(150);
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS vehicle VARCHAR(150);
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS start_time VARCHAR(20);
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS waste_type VARCHAR(50) DEFAULT 'General Waste';
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Scheduled';
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    ALTER TABLE company_schedules ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;

    CREATE INDEX IF NOT EXISTS company_schedules_company_id_idx ON company_schedules (company_id);
    CREATE INDEX IF NOT EXISTS company_schedules_company_day_idx ON company_schedules (company_id, day);
    CREATE INDEX IF NOT EXISTS company_schedules_company_date_idx ON company_schedules (company_id, schedule_date);
  `);
};

const toSchedule = (row: any): CompanySchedule => ({
  ...row,
  cells: Array.isArray(row.cells)
    ? row.cells
    : typeof row.cells === "string"
      ? JSON.parse(row.cells)
      : row.cells && typeof row.cells === "object"
        ? Object.values(row.cells)
        : [],
});

export const getCompanySchedules = async (companyId: number): Promise<CompanySchedule[]> => {
  const result = await pool.query(
    `SELECT * FROM company_schedules WHERE company_id = $1 ORDER BY created_at DESC`,
    [companyId],
  );

  return result.rows.map(toSchedule);
};

export const getCompanyScheduleById = async (companyId: number, scheduleId: number): Promise<CompanySchedule | null> => {
  const result = await pool.query(
    `SELECT * FROM company_schedules WHERE company_id = $1 AND id = $2 LIMIT 1`,
    [companyId, scheduleId],
  );

  return result.rows[0] ? toSchedule(result.rows[0]) : null;
};

export const getCompanySchedulesByDate = async (companyId: number, scheduleDate: string): Promise<CompanySchedule[]> => {
  const result = await pool.query(
    `SELECT * FROM company_schedules WHERE company_id = $1 AND schedule_date = $2 ORDER BY created_at DESC`,
    [companyId, scheduleDate],
  );

  return result.rows.map(toSchedule);
};

export const createCompanySchedule = async (data: Omit<CompanySchedule, "id" | "created_at" | "updated_at">): Promise<CompanySchedule> => {
  const result = await pool.query(
    `INSERT INTO company_schedules (
      company_id, district_id, district_name, schedule_date, day, sector_id, sector_name, cells,
      driver, vehicle, start_time, waste_type, status, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *`,
    [
      data.company_id,
      data.district_id ?? null,
      data.district_name ?? null,
      data.schedule_date,
      data.day,
      data.sector_id ?? null,
      data.sector_name ?? null,
      JSON.stringify(data.cells || []),
      data.driver ?? null,
      data.vehicle ?? null,
      data.start_time ?? null,
      data.waste_type,
      data.status,
      data.notes ?? null,
    ],
  );

  return toSchedule(result.rows[0]);
};

export const updateCompanySchedule = async (
  companyId: number,
  scheduleId: number,
  data: Partial<Omit<CompanySchedule, "id" | "company_id" | "created_at" | "updated_at">>,
): Promise<CompanySchedule | null> => {
  const existing = await getCompanyScheduleById(companyId, scheduleId);
  if (!existing) return null;

  const next = { ...existing, ...data };
  const result = await pool.query(
    `UPDATE company_schedules SET
      district_id = $1,
      district_name = $2,
      schedule_date = $3,
      day = $4,
      sector_id = $5,
      sector_name = $6,
      cells = $7,
      driver = $8,
      vehicle = $9,
      start_time = $10,
      waste_type = $11,
      status = $12,
      notes = $13,
      updated_at = NOW()
    WHERE company_id = $14 AND id = $15
    RETURNING *`,
    [
      next.district_id ?? null,
      next.district_name ?? null,
      next.schedule_date,
      next.day,
      next.sector_id ?? null,
      next.sector_name ?? null,
      JSON.stringify(next.cells || []),
      next.driver ?? null,
      next.vehicle ?? null,
      next.start_time ?? null,
      next.waste_type,
      next.status,
      next.notes ?? null,
      companyId,
      scheduleId,
    ],
  );

  return result.rows[0] ? toSchedule(result.rows[0]) : null;
};

export const deleteCompanySchedule = async (companyId: number, scheduleId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM company_schedules WHERE company_id = $1 AND id = $2`,
    [companyId, scheduleId],
  );

  return (result.rowCount ?? 0) > 0;
};

export const getSchedulesByDistrictAndSector = async (
  district: string,
  sector?: string,
): Promise<CompanySchedule[]> => {
  if (sector) {
    const result = await pool.query(
      `SELECT * FROM company_schedules
       WHERE LOWER(district_name) = LOWER($1) AND LOWER(sector_name) = LOWER($2)
         AND published = TRUE
       ORDER BY schedule_date ASC`,
      [district, sector],
    );
    return result.rows.map(toSchedule);
  }

  const result = await pool.query(
    `SELECT * FROM company_schedules
     WHERE LOWER(district_name) = LOWER($1) AND published = TRUE
     ORDER BY schedule_date ASC`,
    [district],
  );
  return result.rows.map(toSchedule);
};

export const setSchedulePublished = async (
  companyId: number,
  scheduleId: number,
  published: boolean,
): Promise<CompanySchedule | null> => {
  const result = await pool.query(
    `UPDATE company_schedules SET published = $1, updated_at = NOW()
     WHERE company_id = $2 AND id = $3 RETURNING *`,
    [published, companyId, scheduleId],
  );
  return result.rows[0] ? toSchedule(result.rows[0]) : null;
};