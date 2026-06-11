import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { cashIn, transactionStatus, webhook, pingPaypack } from "../controllers/paypackController";

const router = Router();

// POST /api/paypack/cashin — authenticated citizen initiates Cash In
router.post("/cashin", authenticate, cashIn);

// GET /api/paypack/status/:ref — authenticated user polls transaction status
router.get("/status/:ref", authenticate, transactionStatus);

// POST /api/paypack/webhook — public, called by Paypack servers
router.post("/webhook", webhook);

// GET /api/paypack/ping — connectivity test (no auth, safe read-only)
router.get("/ping", pingPaypack);

export default router;
