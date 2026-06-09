import { Router } from "express";
import { authenticate, authorizeAdmin, authorizeDriver } from "../middleware/auth";
import {
  submitComplaint,
  getMyComplaints,
  listAllComplaints,
  patchComplaintStatus,
  removeComplaint,
  getDistrictComplaints,
} from "../controllers/complaintController";

const router = Router();

/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Submit a complaint (Citizen)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [issue_type, description]
 *             properties:
 *               issue_type: { type: string, example: "Missed Collection" }
 *               description: { type: string, example: "Truck did not arrive on Monday" }
 *               priority: { type: string, enum: [Low, Medium, High, Urgent], default: Medium }
 *     responses:
 *       201:
 *         description: Complaint submitted
 */
router.post("/", authenticate, submitComplaint);

/**
 * @swagger
 * /api/complaints/me:
 *   get:
 *     summary: Get my complaints (Citizen)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of citizen's complaints
 */
router.get("/me", authenticate, getMyComplaints);

/**
 * @swagger
 * /api/complaints/district/{district}:
 *   get:
 *     summary: Get complaints for a district (Waste Collector / Admin)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: district
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Complaints in the given district
 */
router.get("/district/:district", authenticate, authorizeDriver, getDistrictComplaints);

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: Get all complaints (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All complaints
 */
router.get("/", authenticate, authorizeAdmin, listAllComplaints);

/**
 * @swagger
 * /api/complaints/{id}/status:
 *   patch:
 *     summary: Update complaint status (Admin only)
 *     tags: [Complaints]
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
 *               status: { type: string, enum: [Pending, In Progress, Resolved] }
 *               assigned_to: { type: string }
 *               resolution_note: { type: string }
 *     responses:
 *       200:
 *         description: Complaint updated
 */
router.patch("/:id/status", authenticate, authorizeAdmin, patchComplaintStatus);

/**
 * @swagger
 * /api/complaints/{id}:
 *   delete:
 *     summary: Delete a complaint (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Complaint deleted
 */
router.delete("/:id", authenticate, authorizeAdmin, removeComplaint);

export default router;
