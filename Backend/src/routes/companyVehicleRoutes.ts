import { Router } from "express";
import { authenticate, authorizeDriver } from "../middleware/auth";
import { listVehicles, addVehicle, removeVehicle } from "../controllers/companyVehicleController";

const router = Router();

router.get("/company/:companyId", authenticate, authorizeDriver, listVehicles);
router.post("/company/:companyId", authenticate, authorizeDriver, addVehicle);
router.delete("/company/:companyId/:vehicleId", authenticate, authorizeDriver, removeVehicle);

export default router;
