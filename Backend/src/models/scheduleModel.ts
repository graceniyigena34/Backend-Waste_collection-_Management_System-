import { pool } from "../config/db";

export type ScheduleStatus = "Scheduled" | "Completed" | "Missed" | "Pending";
export type WasteType = "General Waste" | "Recyclables" | "Organic Waste" | "Hazardous";

export interface Schedule {
  id: number;
  household_id: number;
  user_id: number;
  collection_date: string;
  collection_time: string;
  waste_type: WasteType;
  status: ScheduleStatus;
  location: string;
  driver_id?: number;
  notes?: string;
  created_at?: Date;
}

export const initSchedulesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      collection_date DATE NOT NULL,
      collection_time VARCHAR(20) NOT NULL DEFAULT '08:00 AM',
      waste_type VARCHAR(50) NOT NULL DEFAULT 'General Waste',
      status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
      location VARCHAR(255) NOT NULL,
      driver_id INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export const createSchedule = async (
  data: Omit<Schedule, "id" | "created_at">
): Promise<Schedule> => {
  const result = await pool.query(
    `INSERT INTO schedules (household_id, user_id, collection_date, collection_time, waste_type, status, location, driver_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.household_id, data.user_id, data.collection_date, data.collection_time, data.waste_type, data.status, data.location, data.driver_id ?? null, data.notes ?? null]
  );
  return result.rows[0];
};

export const getSchedulesByUserId = async (user_id: number): Promise<Schedule[]> => {
  const result = await pool.query(
    "SELECT * FROM schedules WHERE user_id = $1 ORDER BY collection_date ASC",
    [user_id]
  );
  return result.rows;
};

export const getSchedulesByDriverId = async (driver_id: number): Promise<Schedule[]> => {
  const result = await pool.query(
    "SELECT s.*, u.full_name as citizen_name, h.street_address FROM schedules s JOIN users u ON s.user_id = u.id JOIN households h ON s.household_id = h.id WHERE s.driver_id = $1 ORDER BY s.collection_date ASC",
    [driver_id]
  );
  return result.rows;
};

export const getAllSchedules = async (): Promise<Schedule[]> => {
  const result = await pool.query(
    `SELECT s.*, u.full_name as citizen_name, h.zone, h.street_address
     FROM schedules s
     JOIN users u ON s.user_id = u.id
     JOIN households h ON s.household_id = h.id
     ORDER BY s.collection_date ASC`
  );
  return result.rows;
};

export const updateScheduleStatus = async (
  id: number,
  status: ScheduleStatus
): Promise<Schedule | null> => {
  const result = await pool.query(
    "UPDATE schedules SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0] || null;
};

export const deleteSchedule = async (id: number): Promise<boolean> => {
  const result = await pool.query("DELETE FROM schedules WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};
