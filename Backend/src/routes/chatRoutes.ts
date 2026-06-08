import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { listChatMessages, sendChatMessage } from "../controllers/chatController";

const router = Router();

// GET  /api/chat/company/:companyId  — fetch messages
router.get("/company/:companyId", authenticate, listChatMessages);

// POST /api/chat/company/:companyId  — send a message
router.post("/company/:companyId", authenticate, sendChatMessage);

export default router;
