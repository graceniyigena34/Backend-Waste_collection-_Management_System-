import { Router } from "express";
import { authenticate, authorizeDriver } from "../middleware/auth";
import {
  createCompanyScheduleEntry,
  listCompanySchedules,
  listCompanySchedulesByDate,
  removeCompanyScheduleEntry,
  updateCompanyScheduleEntry,
} from "../controllers/companyScheduleController";

const router = Router();

/**
 * @swagger
 * /api/company-schedules/company/{companyId}:
 *   get:
 *     summary: Get all schedules for a company
 *     tags: [Company Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.get("/company/:companyId", authenticate, authorizeDriver, listCompanySchedules);

/**
 * @swagger
 * /api/company-schedules/company/{companyId}/date/{scheduleDate}:
 *   get:
 *     summary: Get all schedules for a company on a specific date
 *     tags: [Company Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.get("/company/:companyId/date/:scheduleDate", authenticate, authorizeDriver, listCompanySchedulesByDate);

/**
 * @swagger
 * /api/company-schedules/company/{companyId}:
 *   post:
 *     summary: Create a company schedule
 *     tags: [Company Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.post("/company/:companyId", authenticate, authorizeDriver, createCompanyScheduleEntry);

/**
 * @swagger
 * /api/company-schedules/company/{companyId}/{scheduleId}:
 *   put:
 *     summary: Update a company schedule
 *     tags: [Company Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.put("/company/:companyId/:scheduleId", authenticate, authorizeDriver, updateCompanyScheduleEntry);

/**
 * @swagger
 * /api/company-schedules/company/{companyId}/{scheduleId}:
 *   delete:
 *     summary: Delete a company schedule
 *     tags: [Company Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/company/:companyId/:scheduleId", authenticate, authorizeDriver, removeCompanyScheduleEntry);

export default router;