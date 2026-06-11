import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  cashIn,
  transactionStatus,
  webhookVerify,
  webhookReceive,
  ping,
} from "../controllers/paypackController";

const router = Router();

// Authenticated payment endpoints
router.post("/cashin", authenticate, cashIn);
router.get("/status/:ref", authenticate, transactionStatus);

// Webhook — GET and HEAD for Paypack URL verification, POST for events
router.get("/webhook", webhookVerify);
router.head("/webhook", webhookVerify);
router.post("/webhook", webhookReceive);

// Public connectivity check
router.get("/ping", ping);

export default router;
