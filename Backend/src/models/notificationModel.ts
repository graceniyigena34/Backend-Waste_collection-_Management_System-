import { pool } from "../config/db";

export type NotificationType = "info" | "warning" | "success";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at?: Date;
}

export const initNotificationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'info',
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export const createNotification = async (
  data: Omit<Notification, "id" | "read" | "created_at">
): Promise<Notification> => {
  const result = await pool.query(
    "INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4) RETURNING *",
    [data.user_id, data.title, data.message, data.type]
  );
  return result.rows[0];
};

export const getNotificationsByUserId = async (user_id: number): Promise<Notification[]> => {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
    [user_id]
  );
  return result.rows;
};

export const markNotificationRead = async (id: number, user_id: number): Promise<Notification | null> => {
  const result = await pool.query(
    "UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, user_id]
  );
  return result.rows[0] || null;
};

export const markAllNotificationsRead = async (user_id: number): Promise<void> => {
  await pool.query("UPDATE notifications SET read = TRUE WHERE user_id = $1", [user_id]);
};

export const deleteNotification = async (id: number, user_id: number): Promise<boolean> => {
  const result = await pool.query(
    "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
    [id, user_id]
  );
  return (result.rowCount ?? 0) > 0;
};
