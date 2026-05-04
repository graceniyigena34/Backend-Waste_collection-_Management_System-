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
exports.getCollectorsByRole = exports.updateManagerInfo = exports.getTeamByManager = exports.getManagersByCompany = exports.getManagerInfo = exports.createManager = exports.updateDriverInfo = exports.getDriversByCompany = exports.getDriverInfo = exports.createDriver = exports.getTopPerformers = exports.getAssignmentStats = exports.updateAssignment = exports.getAssignmentsByDate = exports.getCollectorAssignments = exports.assignCollectorToRoute = exports.getPerformanceHistory = exports.updatePerformanceMetrics = exports.getOrCreatePerformanceMetrics = exports.getAllWasteCollectors = exports.deleteWasteCollector = exports.updateCollectorVerification = exports.updateCollectorStatus = exports.updateWasteCollector = exports.getWasteCollectorsByZone = exports.getWasteCollectorsByStatus = exports.getWasteCollectorsByCompany = exports.getWasteCollectorByEmployeeId = exports.getWasteCollectorByUserId = exports.getWasteCollectorById = exports.createWasteCollector = exports.initWasteCollectorTables = exports.initWasteCompaniesTable = void 0;
const db_1 = require("../config/db");
// ─── Waste Companies Table ──────────────────────────────────────────────────
const initWasteCompaniesTable = () => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS waste_companies (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(150) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
});
exports.initWasteCompaniesTable = initWasteCompaniesTable;
// ─── Initialize Tables ───────────────────────────────────────────────────────
const initWasteCollectorTables = () => __awaiter(void 0, void 0, void 0, function* () {
    // Waste Collectors table
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS waste_collectors (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      company_id INTEGER NOT NULL,
      employee_id VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'driver',
      status VARCHAR(20) DEFAULT 'active',
      verification_status VARCHAR(20) DEFAULT 'pending',
      identification_type VARCHAR(50),
      identification_number VARCHAR(50) UNIQUE,
      date_of_birth DATE,
      address TEXT,
      assigned_zone_id INTEGER,
      performance_rating DECIMAL(3,2) DEFAULT 0,
      total_collections INTEGER DEFAULT 0,
      active_routes INTEGER DEFAULT 0,
      hire_date DATE NOT NULL,
      salary DECIMAL(10,2),
      contract_type VARCHAR(50),
      vehicle_id INTEGER,
      documents_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES waste_companies(id) ON DELETE CASCADE
    )
  `);
    // Driver-specific information
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS collector_drivers (
      id SERIAL PRIMARY KEY,
      collector_id INTEGER NOT NULL UNIQUE,
      license_type VARCHAR(10) NOT NULL,
      license_number VARCHAR(50) UNIQUE NOT NULL,
      license_expiry DATE NOT NULL,
      vehicle_registration VARCHAR(50),
      driving_experience_years INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (collector_id) REFERENCES waste_collectors(id) ON DELETE CASCADE
    )
  `);
    // Manager-specific information
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS collector_managers (
      id SERIAL PRIMARY KEY,
      collector_id INTEGER NOT NULL UNIQUE,
      manages_team BOOLEAN DEFAULT FALSE,
      team_size INTEGER DEFAULT 0,
      supervisor_id INTEGER,
      department VARCHAR(100),
      qualifications TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (collector_id) REFERENCES waste_collectors(id) ON DELETE CASCADE,
      FOREIGN KEY (supervisor_id) REFERENCES waste_collectors(id) ON DELETE SET NULL
    )
  `);
    // Performance metrics table
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS collector_performance (
      id SERIAL PRIMARY KEY,
      collector_id INTEGER NOT NULL,
      total_collections INTEGER DEFAULT 0,
      successful_collections INTEGER DEFAULT 0,
      failed_collections INTEGER DEFAULT 0,
      average_time_per_collection DECIMAL(10,2),
      customer_rating DECIMAL(3,2),
      completion_rate DECIMAL(5,2),
      on_time_rate DECIMAL(5,2),
      total_weight_collected DECIMAL(10,2),
      month VARCHAR(7),
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (collector_id) REFERENCES waste_collectors(id) ON DELETE CASCADE,
      UNIQUE(collector_id, month)
    )
  `);
    // Collector assignments table
    yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS collector_assignments (
      id SERIAL PRIMARY KEY,
      collector_id INTEGER NOT NULL,
      route_id INTEGER,
      schedule_id INTEGER,
      assignment_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'assigned',
      collection_count INTEGER DEFAULT 0,
      waste_collected_kg DECIMAL(10,2) DEFAULT 0,
      start_time TIMESTAMP,
      end_time TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (collector_id) REFERENCES waste_collectors(id) ON DELETE CASCADE
    )
  `);
    // Create indexes for better query performance
    yield db_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_collector_company ON waste_collectors(company_id)`);
    yield db_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_collector_user ON waste_collectors(user_id)`);
    yield db_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_collector_status ON waste_collectors(status)`);
    yield db_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_assignment_collector ON collector_assignments(collector_id)`);
    yield db_1.pool.query(`CREATE INDEX IF NOT EXISTS idx_assignment_date ON collector_assignments(assignment_date)`);
});
exports.initWasteCollectorTables = initWasteCollectorTables;
// ─── Waste Collector CRUD Operations ──────────────────────────────────────────
const createWasteCollector = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`INSERT INTO waste_collectors 
    (user_id, company_id, employee_id, full_name, email, phone, role, status, verification_status, 
     identification_type, identification_number, date_of_birth, address, assigned_zone_id, 
     hire_date, salary, contract_type, vehicle_id, documents_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *`, [
        data.user_id,
        data.company_id,
        data.employee_id,
        data.full_name,
        data.email,
        data.phone,
        data.role || "driver",
        data.status,
        data.verification_status,
        data.identification_type,
        data.identification_number,
        data.date_of_birth,
        data.address,
        data.assigned_zone_id,
        data.hire_date,
        data.salary,
        data.contract_type,
        data.vehicle_id,
        data.documents_verified,
    ]);
    return result.rows[0];
});
exports.createWasteCollector = createWasteCollector;
const getWasteCollectorById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM waste_collectors WHERE id = $1`, [id]);
    return result.rows[0] || null;
});
exports.getWasteCollectorById = getWasteCollectorById;
const getWasteCollectorByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM waste_collectors WHERE user_id = $1`, [user_id]);
    return result.rows[0] || null;
});
exports.getWasteCollectorByUserId = getWasteCollectorByUserId;
const getWasteCollectorByEmployeeId = (employee_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM waste_collectors WHERE employee_id = $1`, [employee_id]);
    return result.rows[0] || null;
});
exports.getWasteCollectorByEmployeeId = getWasteCollectorByEmployeeId;
const getWasteCollectorsByCompany = (company_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM waste_collectors WHERE company_id = $1 ORDER BY created_at DESC`, [company_id]);
    return result.rows;
});
exports.getWasteCollectorsByCompany = getWasteCollectorsByCompany;
const getWasteCollectorsByStatus = (company_id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM waste_collectors WHERE company_id = $1 AND status = $2 ORDER BY full_name`, [company_id, status]);
    return result.rows;
});
exports.getWasteCollectorsByStatus = getWasteCollectorsByStatus;
const getWasteCollectorsByZone = (company_id, zone_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM waste_collectors WHERE company_id = $1 AND assigned_zone_id = $2 ORDER BY full_name`, [company_id, zone_id]);
    return result.rows;
});
exports.getWasteCollectorsByZone = getWasteCollectorsByZone;
const updateWasteCollector = (id, fields) => __awaiter(void 0, void 0, void 0, function* () {
    const keys = Object.keys(fields).filter((k) => k !== "id" && k !== "created_at" && k !== "updated_at");
    if (keys.length === 0)
        return (0, exports.getWasteCollectorById)(id);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);
    const result = yield db_1.pool.query(`UPDATE waste_collectors SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`, [...values, id]);
    return result.rows[0] || null;
});
exports.updateWasteCollector = updateWasteCollector;
const updateCollectorStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`UPDATE waste_collectors SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, id]);
    return result.rows[0] || null;
});
exports.updateCollectorStatus = updateCollectorStatus;
const updateCollectorVerification = (id, verification_status) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`UPDATE waste_collectors SET verification_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [verification_status, id]);
    return result.rows[0] || null;
});
exports.updateCollectorVerification = updateCollectorVerification;
const deleteWasteCollector = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield db_1.pool.query(`DELETE FROM waste_collectors WHERE id = $1`, [id]);
    return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
});
exports.deleteWasteCollector = deleteWasteCollector;
const getAllWasteCollectors = (company_id_1, ...args_1) => __awaiter(void 0, [company_id_1, ...args_1], void 0, function* (company_id, limit = 50, offset = 0) {
    const result = yield db_1.pool.query(`SELECT * FROM waste_collectors WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [company_id, limit, offset]);
    return result.rows;
});
exports.getAllWasteCollectors = getAllWasteCollectors;
// ─── Performance Tracking ─────────────────────────────────────────────────────
const getOrCreatePerformanceMetrics = (collector_id, month) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield db_1.pool.query(`SELECT * FROM collector_performance WHERE collector_id = $1 AND month = $2`, [collector_id, month]);
    if (result.rows.length === 0) {
        result = yield db_1.pool.query(`INSERT INTO collector_performance (collector_id, month) VALUES ($1, $2) RETURNING *`, [collector_id, month]);
    }
    return result.rows[0];
});
exports.getOrCreatePerformanceMetrics = getOrCreatePerformanceMetrics;
const updatePerformanceMetrics = (collector_id, month, metrics) => __awaiter(void 0, void 0, void 0, function* () {
    const keys = Object.keys(metrics).filter((k) => k !== "id" && k !== "created_at");
    if (keys.length === 0) {
        return yield db_1.pool
            .query(`SELECT * FROM collector_performance WHERE collector_id = $1 AND month = $2`, [collector_id, month])
            .then((r) => r.rows[0] || null);
    }
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => metrics[k]);
    const result = yield db_1.pool.query(`UPDATE collector_performance SET ${setClauses} WHERE collector_id = $${keys.length + 1} AND month = $${keys.length + 2} RETURNING *`, [...values, collector_id, month]);
    return result.rows[0] || null;
});
exports.updatePerformanceMetrics = updatePerformanceMetrics;
const getPerformanceHistory = (collector_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM collector_performance WHERE collector_id = $1 ORDER BY month DESC`, [collector_id]);
    return result.rows;
});
exports.getPerformanceHistory = getPerformanceHistory;
// ─── Collector Assignments ───────────────────────────────────────────────────
const assignCollectorToRoute = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`INSERT INTO collector_assignments 
    (collector_id, route_id, schedule_id, assignment_date, status, collection_count, waste_collected_kg, start_time, end_time, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`, [
        data.collector_id,
        data.route_id,
        data.schedule_id,
        data.assignment_date,
        data.status,
        data.collection_count,
        data.waste_collected_kg,
        data.start_time,
        data.end_time,
        data.notes,
    ]);
    return result.rows[0];
});
exports.assignCollectorToRoute = assignCollectorToRoute;
const getCollectorAssignments = (collector_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM collector_assignments WHERE collector_id = $1 ORDER BY assignment_date DESC`, [collector_id]);
    return result.rows;
});
exports.getCollectorAssignments = getCollectorAssignments;
const getAssignmentsByDate = (collector_id, date) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM collector_assignments WHERE collector_id = $1 AND DATE(assignment_date) = $2 ORDER BY start_time`, [collector_id, date]);
    return result.rows;
});
exports.getAssignmentsByDate = getAssignmentsByDate;
const updateAssignment = (id, fields) => __awaiter(void 0, void 0, void 0, function* () {
    const keys = Object.keys(fields).filter((k) => k !== "id" && k !== "created_at");
    if (keys.length === 0) {
        const result = yield db_1.pool.query(`SELECT * FROM collector_assignments WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);
    const result = yield db_1.pool.query(`UPDATE collector_assignments SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`, [...values, id]);
    return result.rows[0] || null;
});
exports.updateAssignment = updateAssignment;
const getAssignmentStats = (company_id, start_date, end_date) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT 
      wc.id,
      wc.full_name,
      COUNT(ca.id) as total_assignments,
      SUM(CASE WHEN ca.status = 'completed' THEN 1 ELSE 0 END) as completed_assignments,
      SUM(ca.collection_count) as total_collections,
      SUM(ca.waste_collected_kg) as total_waste_kg,
      AVG(ca.waste_collected_kg) as avg_waste_per_assignment
    FROM waste_collectors wc
    LEFT JOIN collector_assignments ca ON wc.id = ca.collector_id 
      AND DATE(ca.assignment_date) BETWEEN $1 AND $2
    WHERE wc.company_id = $3
    GROUP BY wc.id, wc.full_name
    ORDER BY total_assignments DESC`, [start_date, end_date, company_id]);
    return result.rows;
});
exports.getAssignmentStats = getAssignmentStats;
const getTopPerformers = (company_id, month) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT 
      wc.id,
      wc.full_name,
      cp.total_collections,
      cp.completion_rate,
      cp.customer_rating,
      cp.on_time_rate
    FROM waste_collectors wc
    JOIN collector_performance cp ON wc.id = cp.collector_id
    WHERE wc.company_id = $1 AND cp.month = $2
    ORDER BY cp.customer_rating DESC, cp.completion_rate DESC
    LIMIT 10`, [company_id, month]);
    return result.rows;
});
exports.getTopPerformers = getTopPerformers;
// ─── Waste Collector Drivers ──────────────────────────────────────────────
const createDriver = (collector_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`INSERT INTO collector_drivers (collector_id, license_type, license_number, license_expiry, vehicle_registration, driving_experience_years)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`, [collector_id, data.license_type, data.license_number, data.license_expiry, data.vehicle_registration, data.driving_experience_years]);
    return result.rows[0];
});
exports.createDriver = createDriver;
const getDriverInfo = (collector_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT wc.*, cd.license_type, cd.license_number, cd.license_expiry, cd.vehicle_registration, cd.driving_experience_years
    FROM waste_collectors wc
    LEFT JOIN collector_drivers cd ON wc.id = cd.collector_id
    WHERE wc.id = $1 AND wc.role = 'driver'`, [collector_id]);
    return result.rows[0] || null;
});
exports.getDriverInfo = getDriverInfo;
const getDriversByCompany = (company_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT wc.*, cd.license_type, cd.license_number, cd.license_expiry, cd.vehicle_registration, cd.driving_experience_years
    FROM waste_collectors wc
    LEFT JOIN collector_drivers cd ON wc.id = cd.collector_id
    WHERE wc.company_id = $1 AND wc.role = 'driver'
    ORDER BY wc.full_name`, [company_id]);
    return result.rows;
});
exports.getDriversByCompany = getDriversByCompany;
const updateDriverInfo = (collector_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const keys = Object.keys(data).filter((k) => ["license_type", "license_number", "license_expiry", "vehicle_registration", "driving_experience_years"].includes(k));
    if (keys.length === 0)
        return (0, exports.getDriverInfo)(collector_id);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => data[k]);
    const result = yield db_1.pool.query(`UPDATE collector_drivers SET ${setClauses}, updated_at = NOW() WHERE collector_id = $${keys.length + 1} RETURNING *`, [...values, collector_id]);
    return result.rows[0] || null;
});
exports.updateDriverInfo = updateDriverInfo;
// ─── Waste Collector Managers ──────────────────────────────────────────────
const createManager = (collector_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`INSERT INTO collector_managers (collector_id, manages_team, team_size, supervisor_id, department, qualifications)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`, [collector_id, data.manages_team || false, data.team_size || 0, data.supervisor_id, data.department, data.qualifications]);
    return result.rows[0];
});
exports.createManager = createManager;
const getManagerInfo = (collector_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT wc.*, cm.manages_team, cm.team_size, cm.supervisor_id, cm.department, cm.qualifications
    FROM waste_collectors wc
    LEFT JOIN collector_managers cm ON wc.id = cm.collector_id
    WHERE wc.id = $1 AND wc.role = 'manager'`, [collector_id]);
    return result.rows[0] || null;
});
exports.getManagerInfo = getManagerInfo;
const getManagersByCompany = (company_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT wc.*, cm.manages_team, cm.team_size, cm.supervisor_id, cm.department, cm.qualifications
    FROM waste_collectors wc
    LEFT JOIN collector_managers cm ON wc.id = cm.collector_id
    WHERE wc.company_id = $1 AND wc.role = 'manager'
    ORDER BY wc.full_name`, [company_id]);
    return result.rows;
});
exports.getManagersByCompany = getManagersByCompany;
const getTeamByManager = (manager_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT wc.* FROM waste_collectors wc
    WHERE wc.role = 'driver' AND wc.id IN (
      SELECT collector_id FROM collector_assignments
      WHERE collector_id IN (
        SELECT collector_id FROM collector_assignments ca1
        WHERE ca1.collector_id IN (
          SELECT id FROM waste_collectors WHERE id = $1
        )
      )
    )`, [manager_id]);
    return result.rows;
});
exports.getTeamByManager = getTeamByManager;
const updateManagerInfo = (manager_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const keys = Object.keys(data).filter((k) => ["manages_team", "team_size", "supervisor_id", "department", "qualifications"].includes(k));
    if (keys.length === 0)
        return (0, exports.getManagerInfo)(manager_id);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => data[k]);
    const result = yield db_1.pool.query(`UPDATE collector_managers SET ${setClauses}, updated_at = NOW() WHERE collector_id = $${keys.length + 1} RETURNING *`, [...values, manager_id]);
    return result.rows[0] || null;
});
exports.updateManagerInfo = updateManagerInfo;
const getCollectorsByRole = (company_id, role) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query(`SELECT * FROM waste_collectors WHERE company_id = $1 AND role = $2 ORDER BY full_name`, [company_id, role]);
    return result.rows;
});
exports.getCollectorsByRole = getCollectorsByRole;
