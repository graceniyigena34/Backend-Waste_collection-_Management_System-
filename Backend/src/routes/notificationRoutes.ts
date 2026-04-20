import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import {
  getMyNotifications,
  readNotification,
  readAllNotifications,
  removeNotification,
  broadcastNotification,
} from "../controllers/notificationController";

const router = Router();

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
router.get("/", authenticate, getMyNotifications);

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
router.patch("/:id/read", authenticate, readNotification);

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
router.patch("/read-all", authenticate, readAllNotifications);

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
router.delete("/:id", authenticate, removeNotification);

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
router.post("/broadcast", authenticate, authorizeAdmin, broadcastNotification);

export default router;
