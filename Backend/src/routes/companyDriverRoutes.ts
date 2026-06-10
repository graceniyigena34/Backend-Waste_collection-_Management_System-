import { Router } from "express";
import { authenticate, authorizeDriver } from "../middleware/auth";
import { listDrivers, addDriver, editDriver, removeDriver } from "../controllers/companyDriverController";

const router = Router();

router.get("/company/:companyId", authenticate, authorizeDriver, listDrivers);
router.post("/company/:companyId", authenticate, authorizeDriver, addDriver);
router.put("/company/:companyId/:driverId", authenticate, authorizeDriver, editDriver);
router.delete("/company/:companyId/:driverId", authenticate, authorizeDriver, removeDriver);

export default router;
