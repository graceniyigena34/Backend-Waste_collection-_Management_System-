import { pool } from "../config/db";

export type CollectorStatus = "active" | "inactive" | "on_duty" | "off_duty" | "suspended";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type CollectorRole = "driver" | "manager" | "supervisor";
export type DriverLicenseType = "A" | "B" | "C" | "D" | "E";

export interface WasteCollector {
  id: number;
  user_id: number;
  company_id: number;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: CollectorRole;
  status: CollectorStatus;
  verification_status: VerificationStatus;
  identification_type: string;
  identification_number: string;
  date_of_birth: Date;
  address: string;
  assigned_zone_id?: number;
  performance_rating?: number;
  total_collections: number;
  active_routes: number;
  hire_date: Date;
  salary: number;
  contract_type: string;
  vehicle_id?: number;
  documents_verified: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface WasteCollectorDriver extends WasteCollector {
  license_type: DriverLicenseType;
  license_number: string;
  license_expiry: Date;
  vehicle_registration: string;
  driving_experience_years: number;
}

export interface DriverData {
  license_type: DriverLicenseType;
  license_number: string;
  license_expiry: Date;
  vehicle_registration?: string;
  driving_experience_years?: number;
}

export interface WasteCollectorManager extends WasteCollector {
  manages_team: boolean;
  team_size?: number;
  supervisor_id?: number;
  department: string;
  qualifications?: string;
}

export interface ManagerData {
  manages_team?: boolean;
  team_size?: number;
  supervisor_id?: number;
  department: string;
  qualifications?: string;
}

export interface CollectorPerformance {
  id: number;
  collector_id: number;
  total_collections: number;
  successful_collections: number;
  failed_collections: number;
  average_time_per_collection: number;
  customer_rating: number;
  completion_rate: number;
  on_time_rate: number;
  total_weight_collected: number;
  month: string;
  created_at?: Date;
}

export interface CollectorAssignment {
  id: number;
  collector_id: number;
  route_id: number;
  schedule_id: number;
  assignment_date: Date;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  collection_count: number;
  waste_collected_kg: number;
  start_time?: Date;
  end_time?: Date;
  notes?: string;
  created_at?: Date;
}

export interface WasteCompanyProfile {
  id: number;
  company_name: string;
  email: string;
  phone: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  tin?: string;
  address?: string;
  description?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  company_logo?: string;
  company_images?: Array<any>;
  company_type?: string;
  years_of_experience?: number;
  number_of_employees?: number;
  manager_name?: string;
  manager_email?: string;
  manager_phone?: string;
  manager_position?: string;
  manager_national_id?: string;
  drivers?: Array<any>;
  vehicles?: Array<any>;
  certificates?: Array<any>;
  rdb_certificates?: Array<any>;
  tax_certificates?: Array<any>;
  service_areas?: Array<any>;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  review_notes?: string;
  reviewed_at?: Date;
  reviewed_by?: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// ─── Waste Companies Table ──────────────────────────────────────────────────

export const initWasteCompaniesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waste_company_profiles (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      owner_name VARCHAR(150),
      owner_email VARCHAR(150),
      owner_phone VARCHAR(20),
      tin VARCHAR(100) UNIQUE,
      address TEXT,
      description TEXT,
      district VARCHAR(100),
      sector VARCHAR(100),
      cell VARCHAR(100),
      village VARCHAR(100),
      company_logo TEXT,
      company_images JSONB DEFAULT '[]'::jsonb,
      company_type VARCHAR(50),
      years_of_experience INTEGER DEFAULT 0,
      number_of_employees INTEGER DEFAULT 0,
      manager_name VARCHAR(150),
      manager_email VARCHAR(150),
      manager_phone VARCHAR(20),
      manager_position VARCHAR(100),
      manager_national_id VARCHAR(50),
      drivers JSONB DEFAULT '[]'::jsonb,
      vehicles JSONB DEFAULT '[]'::jsonb,
      certificates JSONB DEFAULT '[]'::jsonb,
      rdb_certificates JSONB DEFAULT '[]'::jsonb,
      tax_certificates JSONB DEFAULT '[]'::jsonb,
      service_areas JSONB DEFAULT '[]'::jsonb,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      review_notes TEXT,
      reviewed_at TIMESTAMP,
      reviewed_by INTEGER,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150);
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS owner_email VARCHAR(150);
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20);
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS company_logo TEXT;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS company_images JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS manager_name VARCHAR(150);
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS manager_email VARCHAR(150);
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS manager_phone VARCHAR(20);
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS manager_position VARCHAR(100);
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS manager_national_id VARCHAR(50);
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS drivers JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS rdb_certificates JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS tax_certificates JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS review_notes TEXT;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
    ALTER TABLE waste_company_profiles ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;
    
    CREATE INDEX IF NOT EXISTS waste_company_profiles_email_key ON waste_company_profiles (email);
    CREATE INDEX IF NOT EXISTS waste_company_profiles_tin_key ON waste_company_profiles (tin);
  `);
};

// ─── Company Profile Functions ───────────────────────────────────────────────

export const createCompanyProfile = async (companyData: Partial<WasteCompanyProfile>): Promise<WasteCompanyProfile> => {
  const {
    company_name,
    email,
    phone,
    owner_name,
    owner_email,
    owner_phone,
    tin,
    address,
    description,
    district,
    sector,
    cell,
    village,
    company_logo,
    company_images,
    company_type,
    years_of_experience,
    number_of_employees,
    manager_name,
    manager_email,
    manager_phone,
    manager_position,
    manager_national_id,
    drivers,
    vehicles,
    certificates,
    rdb_certificates,
    tax_certificates,
    service_areas,
    notes,
    status,
    review_notes,
    reviewed_at,
    reviewed_by,
    is_active,
  } = companyData;
  
  const result = await pool.query(
    `INSERT INTO waste_company_profiles (company_name, email, phone, owner_name, owner_email, owner_phone, tin, address, description, district, sector, cell, village, company_logo, company_images, company_type, years_of_experience, number_of_employees, manager_name, manager_email, manager_phone, manager_position, manager_national_id, drivers, vehicles, certificates, rdb_certificates, tax_certificates, service_areas, notes, status, review_notes, reviewed_at, reviewed_by, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
     RETURNING *`,
    [company_name, email, phone, owner_name, owner_email, owner_phone, tin, address, description, district, sector, cell, village, company_logo, JSON.stringify(company_images || []), company_type, years_of_experience || 0, number_of_employees || 0, manager_name, manager_email, manager_phone, manager_position, manager_national_id, JSON.stringify(drivers || []), JSON.stringify(vehicles || []), JSON.stringify(certificates || []), JSON.stringify(rdb_certificates || []), JSON.stringify(tax_certificates || []), JSON.stringify(service_areas || []), notes, status || "pending", review_notes, reviewed_at, reviewed_by, is_active !== false]
  );
  
  return result.rows[0];
};

export const getCompanyProfileById = async (id: number): Promise<WasteCompanyProfile | null> => {
  const result = await pool.query(`SELECT * FROM waste_company_profiles WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const getCompanyProfileByEmail = async (email: string): Promise<WasteCompanyProfile | null> => {
  const result = await pool.query(`SELECT * FROM waste_company_profiles WHERE email = $1`, [email]);
  return result.rows[0] || null;
};

export const getCompanyProfileByTin = async (tin: string): Promise<WasteCompanyProfile | null> => {
  const result = await pool.query(`SELECT * FROM waste_company_profiles WHERE tin = $1`, [tin]);
  return result.rows[0] || null;
};

export const getAllCompanyProfiles = async (limit: number = 50, offset: number = 0): Promise<WasteCompanyProfile[]> => {
  const result = await pool.query(`SELECT * FROM waste_company_profiles ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return result.rows;
};

export const getCompanyProfilesByStatus = async (status: string): Promise<WasteCompanyProfile[]> => {
  const result = await pool.query(`SELECT * FROM waste_company_profiles WHERE status = $1 ORDER BY created_at DESC`, [status]);
  return result.rows;
};

export const updateCompanyProfile = async (id: number, updateData: Partial<WasteCompanyProfile>): Promise<WasteCompanyProfile | null> => {
  const fields: string[] = [];
  const values: any[] = [id];
  let paramCount = 2;

  Object.entries(updateData).forEach(([key, value]) => {
    if (key !== "id" && key !== "created_at") {
      if (key === "vehicles" || key === "certificates") {
        fields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    }
  });

  if (fields.length === 0) return getCompanyProfileById(id);

  fields.push(`updated_at = NOW()`);
  const query = `UPDATE waste_company_profiles SET ${fields.join(", ")} WHERE id = $1 RETURNING *`;
  
  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deleteCompanyProfile = async (id: number): Promise<boolean> => {
  const result = await pool.query(`DELETE FROM waste_company_profiles WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};

export const searchCompanyProfiles = async (searchTerm: string): Promise<WasteCompanyProfile[]> => {
  const query = `
    SELECT * FROM waste_company_profiles 
    WHERE company_name ILIKE $1 OR email ILIKE $1 OR district ILIKE $1 OR tin ILIKE $1
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [`%${searchTerm}%`]);
  return result.rows;
};

export const filterCompanyProfiles = async (filters: Partial<WasteCompanyProfile>): Promise<WasteCompanyProfile[]> => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (filters.status) {
    conditions.push(`status = $${paramCount}`);
    values.push(filters.status);
    paramCount++;
  }

  if (filters.is_active !== undefined) {
    conditions.push(`is_active = $${paramCount}`);
    values.push(filters.is_active);
    paramCount++;
  }

  if (filters.company_type) {
    conditions.push(`company_type ILIKE $${paramCount}`);
    values.push(`%${filters.company_type}%`);
    paramCount++;
  }

  if (filters.district) {
    conditions.push(`district ILIKE $${paramCount}`);
    values.push(`%${filters.district}%`);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(`SELECT * FROM waste_company_profiles ${whereClause} ORDER BY created_at DESC`, values);
  return result.rows;
};

// ─── Initialize Tables ───────────────────────────────────────────────────────

export const initWasteCollectorTables = async () => {
  // Waste Collectors table
  await pool.query(`
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
      FOREIGN KEY (company_id) REFERENCES waste_company_profiles(id) ON DELETE CASCADE
    )
  `);

  // Driver-specific information
  await pool.query(`
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
  await pool.query(`
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
  await pool.query(`
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
  await pool.query(`
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
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_collector_company ON waste_collectors(company_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_collector_user ON waste_collectors(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_collector_status ON waste_collectors(status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_assignment_collector ON collector_assignments(collector_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_assignment_date ON collector_assignments(assignment_date)`);
};

// ─── Waste Collector CRUD Operations ──────────────────────────────────────────

export const createWasteCollector = async (data: Omit<WasteCollector, "id" | "created_at" | "updated_at">): Promise<WasteCollector> => {
  const result = await pool.query(
    `INSERT INTO waste_collectors 
    (user_id, company_id, employee_id, full_name, email, phone, role, status, verification_status, 
     identification_type, identification_number, date_of_birth, address, assigned_zone_id, 
     hire_date, salary, contract_type, vehicle_id, documents_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *`,
    [
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
    ]
  );
  return result.rows[0];
};

export const getWasteCollectorById = async (id: number): Promise<WasteCollector | null> => {
  const result = await pool.query(`SELECT * FROM waste_collectors WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const getWasteCollectorByUserId = async (user_id: number): Promise<WasteCollector | null> => {
  const result = await pool.query(`SELECT * FROM waste_collectors WHERE user_id = $1`, [user_id]);
  return result.rows[0] || null;
};

export const getWasteCollectorByEmployeeId = async (employee_id: string): Promise<WasteCollector | null> => {
  const result = await pool.query(`SELECT * FROM waste_collectors WHERE employee_id = $1`, [employee_id]);
  return result.rows[0] || null;
};

export const getWasteCollectorsByCompany = async (company_id: number): Promise<WasteCollector[]> => {
  const result = await pool.query(
    `SELECT * FROM waste_collectors WHERE company_id = $1 ORDER BY created_at DESC`,
    [company_id]
  );
  return result.rows;
};

export const getWasteCollectorsByStatus = async (company_id: number, status: CollectorStatus): Promise<WasteCollector[]> => {
  const result = await pool.query(
    `SELECT * FROM waste_collectors WHERE company_id = $1 AND status = $2 ORDER BY full_name`,
    [company_id, status]
  );
  return result.rows;
};

export const getWasteCollectorsByZone = async (company_id: number, zone_id: number): Promise<WasteCollector[]> => {
  const result = await pool.query(
    `SELECT * FROM waste_collectors WHERE company_id = $1 AND assigned_zone_id = $2 ORDER BY full_name`,
    [company_id, zone_id]
  );
  return result.rows;
};

export const updateWasteCollector = async (id: number, fields: Partial<WasteCollector>): Promise<WasteCollector | null> => {
  const keys = Object.keys(fields).filter((k) => k !== "id" && k !== "created_at" && k !== "updated_at");
  if (keys.length === 0) return getWasteCollectorById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => fields[k as keyof WasteCollector]);

  const result = await pool.query(
    `UPDATE waste_collectors SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
};

export const updateCollectorStatus = async (id: number, status: CollectorStatus): Promise<WasteCollector | null> => {
  const result = await pool.query(
    `UPDATE waste_collectors SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
};

export const updateCollectorVerification = async (id: number, verification_status: VerificationStatus): Promise<WasteCollector | null> => {
  const result = await pool.query(
    `UPDATE waste_collectors SET verification_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [verification_status, id]
  );
  return result.rows[0] || null;
};

export const deleteWasteCollector = async (id: number): Promise<boolean> => {
  const result = await pool.query(`DELETE FROM waste_collectors WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};

export const getAllWasteCollectors = async (company_id: number, limit = 50, offset = 0): Promise<WasteCollector[]> => {
  const result = await pool.query(
    `SELECT * FROM waste_collectors WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [company_id, limit, offset]
  );
  return result.rows;
};

// ─── Performance Tracking ─────────────────────────────────────────────────────

export const getOrCreatePerformanceMetrics = async (collector_id: number, month: string): Promise<CollectorPerformance> => {
  let result = await pool.query(
    `SELECT * FROM collector_performance WHERE collector_id = $1 AND month = $2`,
    [collector_id, month]
  );

  if (result.rows.length === 0) {
    result = await pool.query(
      `INSERT INTO collector_performance (collector_id, month) VALUES ($1, $2) RETURNING *`,
      [collector_id, month]
    );
  }

  return result.rows[0];
};

export const updatePerformanceMetrics = async (
  collector_id: number,
  month: string,
  metrics: Partial<CollectorPerformance>
): Promise<CollectorPerformance | null> => {
  const keys = Object.keys(metrics).filter((k) => k !== "id" && k !== "created_at");
  if (keys.length === 0) {
    return await pool
      .query(`SELECT * FROM collector_performance WHERE collector_id = $1 AND month = $2`, [collector_id, month])
      .then((r) => r.rows[0] || null);
  }

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => metrics[k as keyof CollectorPerformance]);

  const result = await pool.query(
    `UPDATE collector_performance SET ${setClauses} WHERE collector_id = $${keys.length + 1} AND month = $${keys.length + 2} RETURNING *`,
    [...values, collector_id, month]
  );
  return result.rows[0] || null;
};

export const getPerformanceHistory = async (collector_id: number): Promise<CollectorPerformance[]> => {
  const result = await pool.query(
    `SELECT * FROM collector_performance WHERE collector_id = $1 ORDER BY month DESC`,
    [collector_id]
  );
  return result.rows;
};

// ─── Collector Assignments ───────────────────────────────────────────────────

export const assignCollectorToRoute = async (data: Omit<CollectorAssignment, "id" | "created_at">): Promise<CollectorAssignment> => {
  const result = await pool.query(
    `INSERT INTO collector_assignments 
    (collector_id, route_id, schedule_id, assignment_date, status, collection_count, waste_collected_kg, start_time, end_time, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
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
    ]
  );
  return result.rows[0];
};

export const getCollectorAssignments = async (collector_id: number): Promise<CollectorAssignment[]> => {
  const result = await pool.query(
    `SELECT * FROM collector_assignments WHERE collector_id = $1 ORDER BY assignment_date DESC`,
    [collector_id]
  );
  return result.rows;
};

export const getAssignmentsByDate = async (collector_id: number, date: Date): Promise<CollectorAssignment[]> => {
  const result = await pool.query(
    `SELECT * FROM collector_assignments WHERE collector_id = $1 AND DATE(assignment_date) = $2 ORDER BY start_time`,
    [collector_id, date]
  );
  return result.rows;
};

export const updateAssignment = async (id: number, fields: Partial<CollectorAssignment>): Promise<CollectorAssignment | null> => {
  const keys = Object.keys(fields).filter((k) => k !== "id" && k !== "created_at");
  if (keys.length === 0) {
    const result = await pool.query(`SELECT * FROM collector_assignments WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => fields[k as keyof CollectorAssignment]);

  const result = await pool.query(
    `UPDATE collector_assignments SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
};

export const getAssignmentStats = async (company_id: number, start_date: Date, end_date: Date): Promise<any[]> => {
  const result = await pool.query(
    `SELECT 
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
    ORDER BY total_assignments DESC`,
    [start_date, end_date, company_id]
  );
  return result.rows;
};

export const getTopPerformers = async (company_id: number, month: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT 
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
    LIMIT 10`,
    [company_id, month]
  );
  return result.rows;
};

// ─── Waste Collector Drivers ──────────────────────────────────────────────

export const createDriver = async (
  collector_id: number,
  data: DriverData
): Promise<any> => {
  const result = await pool.query(
    `INSERT INTO collector_drivers (collector_id, license_type, license_number, license_expiry, vehicle_registration, driving_experience_years)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [collector_id, data.license_type, data.license_number, data.license_expiry, data.vehicle_registration, data.driving_experience_years]
  );
  return result.rows[0];
};

export const getDriverInfo = async (collector_id: number): Promise<any> => {
  const result = await pool.query(
    `SELECT wc.*, cd.license_type, cd.license_number, cd.license_expiry, cd.vehicle_registration, cd.driving_experience_years
    FROM waste_collectors wc
    LEFT JOIN collector_drivers cd ON wc.id = cd.collector_id
    WHERE wc.id = $1 AND wc.role = 'driver'`,
    [collector_id]
  );
  return result.rows[0] || null;
};

export const getDriversByCompany = async (company_id: number): Promise<any[]> => {
  const result = await pool.query(
    `SELECT wc.*, cd.license_type, cd.license_number, cd.license_expiry, cd.vehicle_registration, cd.driving_experience_years
    FROM waste_collectors wc
    LEFT JOIN collector_drivers cd ON wc.id = cd.collector_id
    WHERE wc.company_id = $1 AND wc.role = 'driver'
    ORDER BY wc.full_name`,
    [company_id]
  );
  return result.rows;
};

export const updateDriverInfo = async (collector_id: number, data: Partial<WasteCollectorDriver>): Promise<any> => {
  const keys = Object.keys(data).filter((k) => ["license_type", "license_number", "license_expiry", "vehicle_registration", "driving_experience_years"].includes(k));
  if (keys.length === 0) return getDriverInfo(collector_id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => data[k as keyof WasteCollectorDriver]);

  const result = await pool.query(
    `UPDATE collector_drivers SET ${setClauses}, updated_at = NOW() WHERE collector_id = $${keys.length + 1} RETURNING *`,
    [...values, collector_id]
  );
  return result.rows[0] || null;
};

// ─── Waste Collector Managers ──────────────────────────────────────────────

export const createManager = async (
  collector_id: number,
  data: ManagerData
): Promise<any> => {
  const result = await pool.query(
    `INSERT INTO collector_managers (collector_id, manages_team, team_size, supervisor_id, department, qualifications)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [collector_id, data.manages_team || false, data.team_size || 0, data.supervisor_id, data.department, data.qualifications]
  );
  return result.rows[0];
};

export const getManagerInfo = async (collector_id: number): Promise<any> => {
  const result = await pool.query(
    `SELECT wc.*, cm.manages_team, cm.team_size, cm.supervisor_id, cm.department, cm.qualifications
    FROM waste_collectors wc
    LEFT JOIN collector_managers cm ON wc.id = cm.collector_id
    WHERE wc.id = $1 AND wc.role = 'manager'`,
    [collector_id]
  );
  return result.rows[0] || null;
};

export const getManagersByCompany = async (company_id: number): Promise<any[]> => {
  const result = await pool.query(
    `SELECT wc.*, cm.manages_team, cm.team_size, cm.supervisor_id, cm.department, cm.qualifications
    FROM waste_collectors wc
    LEFT JOIN collector_managers cm ON wc.id = cm.collector_id
    WHERE wc.company_id = $1 AND wc.role = 'manager'
    ORDER BY wc.full_name`,
    [company_id]
  );
  return result.rows;
};

export const getTeamByManager = async (manager_id: number): Promise<any[]> => {
  const result = await pool.query(
    `SELECT wc.* FROM waste_collectors wc
    WHERE wc.role = 'driver' AND wc.id IN (
      SELECT collector_id FROM collector_assignments
      WHERE collector_id IN (
        SELECT collector_id FROM collector_assignments ca1
        WHERE ca1.collector_id IN (
          SELECT id FROM waste_collectors WHERE id = $1
        )
      )
    )`,
    [manager_id]
  );
  return result.rows;
};

export const updateManagerInfo = async (manager_id: number, data: Partial<WasteCollectorManager>): Promise<any> => {
  const keys = Object.keys(data).filter((k) => ["manages_team", "team_size", "supervisor_id", "department", "qualifications"].includes(k));
  if (keys.length === 0) return getManagerInfo(manager_id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => data[k as keyof WasteCollectorManager]);

  const result = await pool.query(
    `UPDATE collector_managers SET ${setClauses}, updated_at = NOW() WHERE collector_id = $${keys.length + 1} RETURNING *`,
    [...values, manager_id]
  );
  return result.rows[0] || null;
};

export const getCollectorsByRole = async (company_id: number, role: CollectorRole): Promise<WasteCollector[]> => {
  const result = await pool.query(
    `SELECT * FROM waste_collectors WHERE company_id = $1 AND role = $2 ORDER BY full_name`,
    [company_id, role]
  );
  return result.rows;
};
