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
exports.getAllHouseholds = exports.updateHousehold = exports.getHouseholdById = exports.getHouseholdByUserId = exports.createHousehold = exports.initHouseholdsTable = void 0;
const db_1 = require("../config/db");
const initHouseholdsTable = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS households (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      district VARCHAR(100) NOT NULL,
      sector VARCHAR(100) NOT NULL,
      cell VARCHAR(100) NOT NULL,
      village VARCHAR(100) NOT NULL,
      street_address VARCHAR(255) NOT NULL,
      house_type VARCHAR(20) NOT NULL DEFAULT 'RESIDENTIAL',
      residents INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      zone VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
});
exports.initHouseholdsTable = initHouseholdsTable;
const createHousehold = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const result = yield db_1.pool.query(`INSERT INTO households (user_id, district, sector, cell, village, street_address, house_type, residents, notes, zone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [user_id, data.district, data.sector, data.cell, data.village, data.street_address, data.house_type, data.residents, (_a = data.notes) !== null && _a !== void 0 ? _a : null, (_b = data.zone) !== null && _b !== void 0 ? _b : null]);
    return result.rows[0];
});
exports.createHousehold = createHousehold;
const getHouseholdByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM households WHERE user_id = $1", [user_id]);
    return result.rows[0] || null;
});
exports.getHouseholdByUserId = getHouseholdByUserId;
const getHouseholdById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM households WHERE id = $1", [id]);
    return result.rows[0] || null;
});
exports.getHouseholdById = getHouseholdById;
const updateHousehold = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const keys = Object.keys(data);
    if (keys.length === 0)
        return (0, exports.getHouseholdByUserId)(user_id);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => data[k]);
    const result = yield db_1.pool.query(`UPDATE households SET ${setClauses}, updated_at = NOW() WHERE user_id = $${keys.length + 1} RETURNING *`, [...values, user_id]);
    return result.rows[0] || null;
});
exports.updateHousehold = updateHousehold;
const getAllHouseholds = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`
    SELECT h.*, u.full_name, u.email, u.telephone
    FROM households h
    JOIN users u ON h.user_id = u.id
    ORDER BY h.created_at DESC
  `);
    return result.rows;
});
exports.getAllHouseholds = getAllHouseholds;
