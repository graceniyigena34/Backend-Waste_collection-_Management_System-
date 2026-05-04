"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const complaintController_1 = require("../controllers/complaintController");
const router = (0, express_1.Router)();
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
router.post("/", auth_1.authenticate, complaintController_1.submitComplaint);
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
router.get("/me", auth_1.authenticate, complaintController_1.getMyComplaints);
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
router.get("/", auth_1.authenticate, auth_1.authorizeAdmin, complaintController_1.listAllComplaints);
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
router.patch("/:id/status", auth_1.authenticate, auth_1.authorizeAdmin, complaintController_1.patchComplaintStatus);
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
router.delete("/:id", auth_1.authenticate, auth_1.authorizeAdmin, complaintController_1.removeComplaint);
exports.default = router;
