import { pool } from "../config/db";

export type ComplaintStatus = "Pending" | "In Progress" | "Resolved";
export type ComplaintPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Complaint {
  id: number;
  user_id: number;
  household_id?: number;
  issue_type: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to?: string;
  resolution_note?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const initComplaintsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
      issue_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
      status VARCHAR(20) NOT NULL DEFAULT 'Pending',
      assigned_to VARCHAR(100),
      resolution_note TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export const createComplaint = async (
  data: Omit<Complaint, "id" | "status" | "created_at" | "updated_at">
): Promise<Complaint> => {
  const result = await pool.query(
    `INSERT INTO complaints (user_id, household_id, issue_type, title, description, priority, assigned_to)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.user_id, data.household_id ?? null, data.issue_type, data.title, data.description, data.priority, data.assigned_to ?? null]
  );
  return result.rows[0];
};

export const getComplaintsByUserId = async (user_id: number): Promise<Complaint[]> => {
  const result = await pool.query(
    "SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC",
    [user_id]
  );
  return result.rows;
};

export const getAllComplaints = async (): Promise<(Complaint & { full_name: string; zone: string })[]> => {
  const result = await pool.query(`
    SELECT c.*, u.full_name, u.telephone, COALESCE(h.zone, 'N/A') as zone
    FROM complaints c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN households h ON c.household_id = h.id
    ORDER BY c.created_at DESC
  `);
  return result.rows;
};

export const updateComplaintStatus = async (
  id: number,
  status: ComplaintStatus,
  assigned_to?: string,
  resolution_note?: string
): Promise<Complaint | null> => {
  const result = await pool.query(
    `UPDATE complaints SET status = $1, assigned_to = COALESCE($2, assigned_to), resolution_note = COALESCE($3, resolution_note), updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [status, assigned_to ?? null, resolution_note ?? null, id]
  );
  return result.rows[0] || null;
};

export const deleteComplaint = async (id: number): Promise<boolean> => {
  const result = await pool.query("DELETE FROM complaints WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const getComplaintsByDistrict = async (district: string): Promise<(Complaint & { full_name: string; zone: string })[]> => {
  const result = await pool.query(`
    SELECT c.*, u.full_name, u.telephone, COALESCE(h.zone, h.district, 'N/A') as zone
    FROM complaints c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN households h ON c.household_id = h.id
    WHERE LOWER(COALESCE(h.district, '')) ILIKE LOWER($1)
    ORDER BY c.created_at DESC
  `, [district]);
  return result.rows;
};
