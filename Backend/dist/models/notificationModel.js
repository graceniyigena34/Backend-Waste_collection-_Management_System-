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
exports.deleteNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotificationsByUserId = exports.createNotification = exports.initNotificationsTable = void 0;
const db_1 = require("../config/db");
const initNotificationsTable = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'info',
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
});
exports.initNotificationsTable = initNotificationsTable;
const createNotification = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4) RETURNING *", [data.user_id, data.title, data.message, data.type]);
    return result.rows[0];
});
exports.createNotification = createNotification;
const getNotificationsByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [user_id]);
    return result.rows;
});
exports.getNotificationsByUserId = getNotificationsByUserId;
const markNotificationRead = (id, user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *", [id, user_id]);
    return result.rows[0] || null;
});
exports.markNotificationRead = markNotificationRead;
const markAllNotificationsRead = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.pool.query("UPDATE notifications SET read = TRUE WHERE user_id = $1", [user_id]);
});
exports.markAllNotificationsRead = markAllNotificationsRead;
const deleteNotification = (id, user_id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield db_1.pool.query("DELETE FROM notifications WHERE id = $1 AND user_id = $2", [id, user_id]);
    return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
});
exports.deleteNotification = deleteNotification;
