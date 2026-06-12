import { Router } from "express";
import { authenticate, authorizeDriver, authorizeAdmin } from "../middleware/auth";
import {
  submitPickupRequest,
  getMyPickupRequests,
  listAllPickupRequests,
  patchPickupStatus,
  cancelPickupRequest,
} from "../controllers/pickupRequestController";

const router = Router();

// Citizen: submit a new pickup request
router.post("/", authenticate, submitPickupRequest);

// Citizen: view own requests
router.get("/me", authenticate, getMyPickupRequests);

// Company / Admin: view all requests with citizen details
router.get("/", authenticate, authorizeDriver, listAllPickupRequests);

// Company / Admin: update status, assign driver, add note
router.patch("/:id/status", authenticate, authorizeDriver, patchPickupStatus);

// Citizen (own pending) or Company/Admin: cancel / delete
router.delete("/:id", authenticate, cancelPickupRequest);

export default router;
