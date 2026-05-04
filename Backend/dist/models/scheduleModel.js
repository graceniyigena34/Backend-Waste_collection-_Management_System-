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
exports.deleteSchedule = exports.updateScheduleStatus = exports.getAllSchedules = exports.getSchedulesByDriverId = exports.getSchedulesByUserId = exports.createSchedule = exports.initSchedulesTable = void 0;
const db_1 = require("../config/db");
const initSchedulesTable = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      collection_date DATE NOT NULL,
      collection_time VARCHAR(20) NOT NULL DEFAULT '08:00 AM',
      waste_type VARCHAR(50) NOT NULL DEFAULT 'General Waste',
      status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
      location VARCHAR(255) NOT NULL,
      driver_id INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
});
exports.initSchedulesTable = initSchedulesTable;
const createSchedule = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const result = yield db_1.pool.query(`INSERT INTO schedules (household_id, user_id, collection_date, collection_time, waste_type, status, location, driver_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [data.household_id, data.user_id, data.collection_date, data.collection_time, data.waste_type, data.status, data.location, (_a = data.driver_id) !== null && _a !== void 0 ? _a : null, (_b = data.notes) !== null && _b !== void 0 ? _b : null]);
    return result.rows[0];
});
exports.createSchedule = createSchedule;
const getSchedulesByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM schedules WHERE user_id = $1 ORDER BY collection_date ASC", [user_id]);
    return result.rows;
});
exports.getSchedulesByUserId = getSchedulesByUserId;
const getSchedulesByDriverId = (driver_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT s.*, u.full_name as citizen_name, h.street_address FROM schedules s JOIN users u ON s.user_id = u.id JOIN households h ON s.household_id = h.id WHERE s.driver_id = $1 ORDER BY s.collection_date ASC", [driver_id]);
    return result.rows;
});
exports.getSchedulesByDriverId = getSchedulesByDriverId;
const getAllSchedules = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT s.*, u.full_name as citizen_name, h.zone, h.street_address
     FROM schedules s
     JOIN users u ON s.user_id = u.id
     JOIN households h ON s.household_id = h.id
     ORDER BY s.collection_date ASC`);
    return result.rows;
});
exports.getAllSchedules = getAllSchedules;
const updateScheduleStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("UPDATE schedules SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
    return result.rows[0] || null;
});
exports.updateScheduleStatus = updateScheduleStatus;
const deleteSchedule = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield db_1.pool.query("DELETE FROM schedules WHERE id = $1", [id]);
    return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
});
exports.deleteSchedule = deleteSchedule;
