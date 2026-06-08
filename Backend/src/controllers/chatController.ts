import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getChatMessages, insertChatMessage } from "../models/chatModel";
import { getCompanyProfileById } from "../models/wasteCollectorModel";

const toNumber = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const listChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const userId = req.user!.id;

  if (!companyId) {
    res.status(400).json({ message: "companyId must be a valid number" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const messages = await getChatMessages(companyId, userId);
  res.json({ messages });
};

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

  const senderRole = role === "waste_collector" || role === "admin" ? "company" : "citizen";

  const chat = await insertChatMessage({
    company_id: companyId,
    user_id: userId,
    sender_role: senderRole,
    sender_name: senderName,
    message,
  });

  res.status(201).json({ message: "Message sent", chat });
};
