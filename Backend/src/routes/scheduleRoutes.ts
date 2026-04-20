import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import {
  getMySchedules,
  getDriverSchedules,
  listAllSchedules,
  createCollectionSchedule,
  patchScheduleStatus,
  removeSchedule,
} from "../controllers/scheduleController";

const router = Router();

/**
 * @swagger
 * /api/schedules/me:
 *   get:
 *     summary: Get my collection schedules (Citizen)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schedules for the logged-in citizen
 */
router.get("/me", authenticate, getMySchedules);

/**
 * @swagger
 * /api/schedules/driver:
 *   get:
 *     summary: Get schedules assigned to me (Driver)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schedules assigned to the driver
 */
router.get("/driver", authenticate, getDriverSchedules);

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Get all schedules (Admin only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All schedules
 */
router.get("/", authenticate, authorizeAdmin, listAllSchedules);

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Create a collection schedule (Admin only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, collection_date, location]
 *             properties:
 *               user_id: { type: integer }
 *               collection_date: { type: string, format: date, example: "2025-01-20" }
 *               collection_time: { type: string, example: "08:00 AM" }
 *               waste_type: { type: string, example: "General Waste" }
 *               location: { type: string, example: "KG 12 St, Kicukiro" }
 *               driver_id: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Schedule created
 */
router.post("/", authenticate, authorizeAdmin, createCollectionSchedule);

/**
 * @swagger
 * /api/schedules/{id}/status:
 *   patch:
 *     summary: Update schedule status (Admin or Driver)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Scheduled, Completed, Missed, Pending] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", authenticate, patchScheduleStatus);

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Delete a schedule (Admin only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Schedule deleted
 */
router.delete("/:id", authenticate, authorizeAdmin, removeSchedule);

export default router;
