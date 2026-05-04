"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get my notifications (Citizen)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get("/", auth_1.authenticate, notificationController_1.getMyNotifications);
/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read (Citizen)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch("/:id/read", auth_1.authenticate, notificationController_1.readNotification);
/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read (Citizen)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch("/read-all", auth_1.authenticate, notificationController_1.readAllNotifications);
/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification (Citizen)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete("/:id", auth_1.authenticate, notificationController_1.removeNotification);
/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Send a notification to a user (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, title, message]
 *             properties:
 *               user_id: { type: integer }
 *               title: { type: string }
 *               message: { type: string }
 *               type: { type: string, enum: [info, warning, success], default: info }
 *     responses:
 *       201:
 *         description: Notification sent
 */
router.post("/broadcast", auth_1.authenticate, auth_1.authorizeAdmin, notificationController_1.broadcastNotification);
exports.default = router;
