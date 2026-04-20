import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createNotification,
  getNotificationsByUserId,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  NotificationType,
} from "../models/notificationModel";

// GET /api/notifications — citizen gets their notifications
export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await getNotificationsByUserId(req.user!.id);
  res.json(notifications);
};

// PATCH /api/notifications/:id/read — mark one notification as read
export const readNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  const updated = await markNotificationRead(Number(req.params.id), req.user!.id);
  if (!updated) {
    res.status(404).json({ message: "Notification not found" });
    return;
  }
  res.json({ message: "Notification marked as read", notification: updated });
};

// PATCH /api/notifications/read-all — mark all as read
export const readAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  await markAllNotificationsRead(req.user!.id);
  res.json({ message: "All notifications marked as read" });
};

// DELETE /api/notifications/:id — delete a notification
export const removeNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  const deleted = await deleteNotification(Number(req.params.id), req.user!.id);
  if (!deleted) {
    res.status(404).json({ message: "Notification not found" });
    return;
  }
  res.json({ message: "Notification deleted" });
};

// POST /api/notifications/broadcast — Admin sends notification to a user
export const broadcastNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  const { user_id, title, message, type } = req.body;

  if (!user_id || !title || !message) {
    res.status(400).json({ message: "user_id, title and message are required" });
    return;
  }

  const safeType: NotificationType = ["info", "warning", "success"].includes(type) ? type : "info";

  const notification = await createNotification({
    user_id: Number(user_id),
    title,
    message,
    type: safeType,
  });

  res.status(201).json({ message: "Notification sent", notification });
};
