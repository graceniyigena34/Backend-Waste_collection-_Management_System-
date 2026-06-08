import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { listChatMessages, sendChatMessage, editChatMessage, removeChatMessage } from "../controllers/chatController";

const router = Router();

// GET  /api/chat/company/:companyId
router.get("/company/:companyId", authenticate, listChatMessages);
// POST /api/chat/company/:companyId
router.post("/company/:companyId", authenticate, sendChatMessage);
// PUT  /api/chat/company/:companyId/:messageId
router.put("/company/:companyId/:messageId", authenticate, editChatMessage);
// DELETE /api/chat/company/:companyId/:messageId
router.delete("/company/:companyId/:messageId", authenticate, removeChatMessage);

export default router;
