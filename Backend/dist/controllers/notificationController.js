"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastNotification = exports.removeNotification = exports.readAllNotifications = exports.readNotification = exports.getMyNotifications = void 0;
const notificationModel_1 = require("../models/notificationModel");
// GET /api/notifications — citizen gets their notifications
const getMyNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const notifications = yield (0, notificationModel_1.getNotificationsByUserId)(req.user.id);
    res.json(notifications);
});
exports.getMyNotifications = getMyNotifications;
// PATCH /api/notifications/:id/read — mark one notification as read
const readNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updated = yield (0, notificationModel_1.markNotificationRead)(Number(req.params.id), req.user.id);
    if (!updated) {
        res.status(404).json({ message: "Notification not found" });
        return;
    }
    res.json({ message: "Notification marked as read", notification: updated });
});
exports.readNotification = readNotification;
// PATCH /api/notifications/read-all — mark all as read
const readAllNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, notificationModel_1.markAllNotificationsRead)(req.user.id);
    res.json({ message: "All notifications marked as read" });
});
exports.readAllNotifications = readAllNotifications;
// DELETE /api/notifications/:id — delete a notification
const removeNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield (0, notificationModel_1.deleteNotification)(Number(req.params.id), req.user.id);
    if (!deleted) {
        res.status(404).json({ message: "Notification not found" });
        return;
    }
    res.json({ message: "Notification deleted" });
});
exports.removeNotification = removeNotification;
// POST /api/notifications/broadcast — Admin sends notification to a user
const broadcastNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, title, message, type } = req.body;
    if (!user_id || !title || !message) {
        res.status(400).json({ message: "user_id, title and message are required" });
        return;
    }
    const safeType = ["info", "warning", "success"].includes(type) ? type : "info";
    const notification = yield (0, notificationModel_1.createNotification)({
        user_id: Number(user_id),
        title,
        message,
        type: safeType,
    });
    res.status(201).json({ message: "Notification sent", notification });
});
exports.broadcastNotification = broadcastNotification;
