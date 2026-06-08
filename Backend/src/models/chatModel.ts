import { pool } from "../config/db";

export interface ChatMessage {
  id: number;
  company_id: number;
  user_id: number;
  sender_role: "citizen" | "company";
  sender_name?: string;
  message: string;
  created_at?: string;
}

export const initChatTable = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('citizen', 'company')),
      sender_name VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
};

export const getChatMessages = async (companyId: number, userId: number): Promise<ChatMessage[]> => {
  const result = await pool.query(
    `SELECT * FROM chat_messages WHERE company_id = $1 AND user_id = $2 ORDER BY created_at ASC`,
    [companyId, userId]
  );
  return result.rows as ChatMessage[];
};

export const insertChatMessage = async (data: Omit<ChatMessage, "id" | "created_at">): Promise<ChatMessage> => {
  const result = await pool.query(
    `INSERT INTO chat_messages (company_id, user_id, sender_role, sender_name, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.company_id, data.user_id, data.sender_role, data.sender_name ?? null, data.message]
  );
  return result.rows[0] as ChatMessage;
};

export const updateChatMessage = async (messageId: number, userId: number, message: string): Promise<ChatMessage | null> => {
  const result = await pool.query(
    `UPDATE chat_messages SET message = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [message, messageId, userId]
  );
  return result.rows[0] as ChatMessage ?? null;
};

export const deleteChatMessage = async (messageId: number, userId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM chat_messages WHERE id = $1 AND user_id = $2`,
    [messageId, userId]
  );
  return (result.rowCount ?? 0) > 0;
};
