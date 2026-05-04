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
exports.getAllUsers = exports.deleteUser = exports.updateUser = exports.createUser = exports.findUserById = exports.findUserByEmail = exports.initUsersTable = void 0;
const db_1 = require("../config/db");
const initUsersTable = () => __awaiter(void 0, void 0, void 0, function* () {
    // Create table if it doesn't exist
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      telephone VARCHAR(20) NOT NULL DEFAULT '',
      role VARCHAR(20) NOT NULL DEFAULT 'citizen',
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
    // Migration: add telephone column if it doesn't exist (handles existing tables)
    yield db_1.pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS telephone VARCHAR(20) NOT NULL DEFAULT ''
  `);
    // Migration: enforce canonical role default and normalize common existing values.
    yield db_1.pool.query(`
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'citizen'
  `);
    yield db_1.pool.query(`
    UPDATE users
    SET role = CASE
      WHEN LOWER(REPLACE(REPLACE(role, '-', '_'), ' ', '_')) = 'waste_collector' THEN 'waste_collector'
      WHEN LOWER(role) = 'admin' THEN 'admin'
      ELSE 'citizen'
    END
  `);
});
exports.initUsersTable = initUsersTable;
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
});
exports.findUserByEmail = findUserByEmail;
const findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
});
exports.findUserById = findUserById;
const createUser = (full_name, email, telephone, role, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("INSERT INTO users (full_name, email, telephone, role, password) VALUES ($1,$2,$3,$4,$5) RETURNING *", [full_name, email, telephone, role, hashedPassword]);
    return result.rows[0];
});
exports.createUser = createUser;
const updateUser = (id, fields) => __awaiter(void 0, void 0, void 0, function* () {
    const keys = Object.keys(fields);
    if (keys.length === 0)
        return (0, exports.findUserById)(id);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);
    const result = yield db_1.pool.query(`UPDATE users SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`, [...values, id]);
    return result.rows[0] || null;
});
exports.updateUser = updateUser;
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield db_1.pool.query("DELETE FROM users WHERE id = $1", [id]);
    return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
});
exports.deleteUser = deleteUser;
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT id, full_name, email, telephone, role, created_at FROM users ORDER BY created_at DESC");
    return result.rows;
});
exports.getAllUsers = getAllUsers;
