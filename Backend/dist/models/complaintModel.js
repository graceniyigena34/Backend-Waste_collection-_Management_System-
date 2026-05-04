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
exports.deleteComplaint = exports.updateComplaintStatus = exports.getAllComplaints = exports.getComplaintsByUserId = exports.createComplaint = exports.initComplaintsTable = void 0;
const db_1 = require("../config/db");
const initComplaintsTable = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
      issue_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
      status VARCHAR(20) NOT NULL DEFAULT 'Pending',
      assigned_to VARCHAR(100),
      resolution_note TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
});
exports.initComplaintsTable = initComplaintsTable;
const createComplaint = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const result = yield db_1.pool.query(`INSERT INTO complaints (user_id, household_id, issue_type, title, description, priority, assigned_to)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [data.user_id, (_a = data.household_id) !== null && _a !== void 0 ? _a : null, data.issue_type, data.title, data.description, data.priority, (_b = data.assigned_to) !== null && _b !== void 0 ? _b : null]);
    return result.rows[0];
});
exports.createComplaint = createComplaint;
const getComplaintsByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC", [user_id]);
    return result.rows;
});
exports.getComplaintsByUserId = getComplaintsByUserId;
const getAllComplaints = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`
    SELECT c.*, u.full_name, u.telephone, COALESCE(h.zone, 'N/A') as zone
    FROM complaints c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN households h ON c.household_id = h.id
    ORDER BY c.created_at DESC
  `);
    return result.rows;
});
exports.getAllComplaints = getAllComplaints;
const updateComplaintStatus = (id, status, assigned_to, resolution_note) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`UPDATE complaints SET status = $1, assigned_to = COALESCE($2, assigned_to), resolution_note = COALESCE($3, resolution_note), updated_at = NOW()
     WHERE id = $4 RETURNING *`, [status, assigned_to !== null && assigned_to !== void 0 ? assigned_to : null, resolution_note !== null && resolution_note !== void 0 ? resolution_note : null, id]);
    return result.rows[0] || null;
});
exports.updateComplaintStatus = updateComplaintStatus;
const deleteComplaint = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield db_1.pool.query("DELETE FROM complaints WHERE id = $1", [id]);
    return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
});
exports.deleteComplaint = deleteComplaint;
