import { pool } from "../config/db";

export interface ChatMessage {
  id: number;
  company_id: number;
  user_id: number;
  citizen_user_id: number;
  sender_role: "citizen" | "company";
  sender_name?: string;
  message: string;
  created_at?: string;
}

export interface ConversationSummary {
  citizen_user_id: number;
  last_message: string;
  last_at: string;
}

export const initChatTable = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      citizen_user_id INTEGER,
      sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('citizen', 'company')),
      sender_name VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Migration: add citizen_user_id column to existing tables
  await pool.query(`
    ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS citizen_user_id INTEGER
  `);
  // Backfill: for citizen messages without citizen_user_id, it equals their own user_id
  await pool.query(`
    UPDATE chat_messages SET citizen_user_id = user_id
    WHERE citizen_user_id IS NULL AND sender_role = 'citizen'
  `);
};

// Returns all messages in a conversation between a citizen and a company
export const getChatMessages = async (companyId: number, citizenUserId: number): Promise<ChatMessage[]> => {
  const result = await pool.query(
    `SELECT * FROM chat_messages WHERE company_id = $1 AND citizen_user_id = $2 ORDER BY created_at ASC`,
    [companyId, citizenUserId]
  );
  return result.rows as ChatMessage[];
};

// Returns every message belonging to a company across all citizen conversations
export const getAllCompanyMessages = async (companyId: number): Promise<ChatMessage[]> => {
  const result = await pool.query(
    `SELECT * FROM chat_messages WHERE company_id = $1 ORDER BY created_at ASC`,
    [companyId]
  );
  return result.rows as ChatMessage[];
};

// Returns a summary of all citizen conversations for a company
export const getCompanyConversations = async (companyId: number): Promise<ConversationSummary[]> => {
  const result = await pool.query(
    `SELECT DISTINCT ON (citizen_user_id)
       citizen_user_id,
       message AS last_message,
       created_at AS last_at
     FROM chat_messages
     WHERE company_id = $1 AND citizen_user_id IS NOT NULL
     ORDER BY citizen_user_id, created_at DESC`,
    [companyId]
  );
  return result.rows as ConversationSummary[];
};

export const insertChatMessage = async (data: Omit<ChatMessage, "id" | "created_at">): Promise<ChatMessage> => {
  const result = await pool.query(
    `INSERT INTO chat_messages (company_id, user_id, citizen_user_id, sender_role, sender_name, message)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.company_id, data.user_id, data.citizen_user_id, data.sender_role, data.sender_name ?? null, data.message]
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
