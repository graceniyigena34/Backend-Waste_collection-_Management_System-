import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getChatMessages,
  getAllCompanyMessages,
  getCompanyConversations,
  insertChatMessage,
  updateChatMessage,
  deleteChatMessage,
} from "../models/chatModel";
import { getCompanyProfileById } from "../models/wasteCollectorModel";

const toNumber = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isCompanyRole = (role: string) => role === "waste_collector" || role === "admin";

// GET /api/chat/company/:companyId/conversations — company/admin only
export const listConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const role = req.user!.role;

  if (!companyId) {
    res.status(400).json({ message: "companyId must be a valid number" });
    return;
  }

  if (!isCompanyRole(role)) {
    res.status(403).json({ message: "Only company or admin users can list conversations" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const conversations = await getCompanyConversations(companyId);
  res.json({ conversations });
};

// GET /api/chat/company/:companyId
// Citizens: see their own conversation.
// Company/admin: must supply ?citizen_user_id=<id> to view a specific conversation.
export const listChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const userId = req.user!.id;
  const role = req.user!.role;

  if (!companyId) {
    res.status(400).json({ message: "companyId must be a valid number" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  if (isCompanyRole(role)) {
    const cid = toNumber(req.query.citizen_user_id);
    if (cid) {
      // Specific citizen conversation requested
      const messages = await getChatMessages(companyId, cid);
      res.json({ messages });
    } else {
      // No filter — return every message for this company
      const messages = await getAllCompanyMessages(companyId);
      res.json({ messages });
    }
    return;
  }

  // Citizen: returns only their own conversation
  const messages = await getChatMessages(companyId, userId);
  res.json({ messages });
};

// POST /api/chat/company/:companyId
// Citizens: send to the company (citizen_user_id inferred from their own id).
// Company/admin: must supply citizen_user_id in the body to reply to a specific citizen.
export const sendChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const userId = req.user!.id;
  const role = req.user!.role;
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  const senderName = typeof req.body.sender_name === "string" ? req.body.sender_name.trim() : undefined;

  if (!companyId) {
    res.status(400).json({ message: "companyId must be a valid number" });
    return;
  }

  if (!message) {
    res.status(400).json({ message: "message is required" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const senderRole = isCompanyRole(role) ? "company" : "citizen";

  let citizenUserId: number;
  if (senderRole === "company") {
    const cid = toNumber(req.body.citizen_user_id);
    if (!cid) {
      res.status(400).json({ message: "citizen_user_id is required when sending as company" });
      return;
    }
    citizenUserId = cid;
  } else {
    citizenUserId = userId;
  }

  const chat = await insertChatMessage({
    company_id: companyId,
    user_id: userId,
    citizen_user_id: citizenUserId,
    sender_role: senderRole,
    sender_name: senderName,
    message,
  });

  res.status(201).json({ message: "Message sent", chat });
};

// POST /api/chat/company/:companyId/reply/:citizenUserId — company/admin replies to a citizen
export const replyToCitizen = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const citizenUserId = toNumber(req.params.citizenUserId);
  const userId = req.user!.id;
  const role = req.user!.role;
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  const senderName = typeof req.body.sender_name === "string" ? req.body.sender_name.trim() : undefined;

  if (!isCompanyRole(role)) {
    res.status(403).json({ message: "Only company or admin users can reply" });
    return;
  }

  if (!companyId || !citizenUserId) {
    res.status(400).json({ message: "companyId and citizenUserId must be valid numbers" });
    return;
  }

  if (!message) {
    res.status(400).json({ message: "message is required" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const chat = await insertChatMessage({
    company_id: companyId,
    user_id: userId,
    citizen_user_id: citizenUserId,
    sender_role: "company",
    sender_name: senderName,
    message,
  });

  res.status(201).json({ message: "Reply sent", chat });
};

export const editChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const messageId = toNumber(req.params.messageId);
  const userId = req.user!.id;
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!companyId || !messageId) {
    res.status(400).json({ message: "companyId and messageId must be valid numbers" });
    return;
  }
  if (!message) {
    res.status(400).json({ message: "message is required" });
    return;
  }

  const updated = await updateChatMessage(messageId, userId, message);
  if (!updated) {
    res.status(404).json({ message: "Message not found or not yours" });
    return;
  }
  res.json({ message: "Message updated", chat: updated });
};

export const removeChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const messageId = toNumber(req.params.messageId);
  const userId = req.user!.id;

  if (!companyId || !messageId) {
    res.status(400).json({ message: "companyId and messageId must be valid numbers" });
    return;
  }

  const deleted = await deleteChatMessage(messageId, userId);
  if (!deleted) {
    res.status(404).json({ message: "Message not found or not yours" });
    return;
  }
  res.json({ message: "Message deleted" });
};
