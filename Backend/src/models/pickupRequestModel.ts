import { pool } from "../config/db";

export type PickupStatus   = "Pending" | "In Progress" | "Resolved" | "Cancelled";
export type PickupPriority = "Low" | "Medium" | "High" | "Urgent";

export interface PickupRequest {
  id: number;
  user_id: number;
  preferred_date: string;
  preferred_time?: string;
  notes?: string;
  priority: PickupPriority;
  status: PickupStatus;
  assigned_driver?: string;
  resolution_note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PickupRequestWithUser extends PickupRequest {
  full_name: string;
  email: string;
  telephone?: string;
  district?: string;
  sector?: string;
  zone?: string;
}

export const initPickupRequestsTable = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pickup_requests (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      preferred_date   DATE NOT NULL,
      preferred_time   VARCHAR(50),
      notes            TEXT,
      priority         VARCHAR(20) NOT NULL DEFAULT 'Medium'
                         CHECK (priority IN ('Low','Medium','High','Urgent')),
      status           VARCHAR(20) NOT NULL DEFAULT 'Pending'
                         CHECK (status IN ('Pending','In Progress','Resolved','Cancelled')),
      assigned_driver  VARCHAR(255),
      resolution_note  TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

export const createPickupRequest = async (
  data: Pick<PickupRequest, "user_id" | "preferred_date" | "preferred_time" | "notes" | "priority">
): Promise<PickupRequest> => {
  const result = await pool.query(
    `INSERT INTO pickup_requests (user_id, preferred_date, preferred_time, notes, priority)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.user_id, data.preferred_date, data.preferred_time ?? null, data.notes ?? null, data.priority]
  );
  return result.rows[0] as PickupRequest;
};

export const getPickupRequestsByUser = async (userId: number): Promise<PickupRequest[]> => {
  const result = await pool.query(
    `SELECT * FROM pickup_requests WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows as PickupRequest[];
};

export const getAllPickupRequests = async (): Promise<PickupRequestWithUser[]> => {
  const result = await pool.query(`
    SELECT pr.*,
           u.full_name, u.email, u.telephone,
           h.district, h.sector, COALESCE(h.zone, h.district, 'N/A') AS zone
    FROM   pickup_requests pr
    JOIN   users u ON pr.user_id = u.id
    LEFT   JOIN households h ON h.user_id = pr.user_id
    ORDER  BY pr.created_at DESC
  `);
  return result.rows as PickupRequestWithUser[];
};

export const updatePickupRequestStatus = async (
  id: number,
  status: PickupStatus,
  assigned_driver?: string,
  resolution_note?: string
): Promise<PickupRequest | null> => {
  const result = await pool.query(
    `UPDATE pickup_requests
     SET status          = $1,
         assigned_driver = COALESCE($2, assigned_driver),
         resolution_note = COALESCE($3, resolution_note),
         updated_at      = NOW()
     WHERE id = $4 RETURNING *`,
    [status, assigned_driver ?? null, resolution_note ?? null, id]
  );
  return (result.rows[0] as PickupRequest) ?? null;
};

export const deletePickupRequest = async (id: number, userId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM pickup_requests WHERE id = $1 AND user_id = $2 AND status = 'Pending'`,
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const deletePickupRequestAdmin = async (id: number): Promise<boolean> => {
  const result = await pool.query(`DELETE FROM pickup_requests WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};
