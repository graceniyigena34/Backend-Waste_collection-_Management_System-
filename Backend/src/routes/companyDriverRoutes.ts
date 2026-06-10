import { Router } from "express";
import { authenticate, authorizeAdmin, authorizeDriver } from "../middleware/auth";
import { listDrivers, listAllDrivers, addDriver, editDriver, removeDriver } from "../controllers/companyDriverController";

const router = Router();

router.get("/all", authenticate, authorizeAdmin, listAllDrivers);
router.get("/company/:companyId", authenticate, authorizeDriver, listDrivers);
router.post("/company/:companyId", authenticate, authorizeDriver, addDriver);
router.put("/company/:companyId/:driverId", authenticate, authorizeDriver, editDriver);
router.delete("/company/:companyId/:driverId", authenticate, authorizeDriver, removeDriver);

export default router;
