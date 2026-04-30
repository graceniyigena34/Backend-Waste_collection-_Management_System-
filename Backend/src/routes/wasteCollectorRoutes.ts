import { Router } from "express";
import {
  registerCollector,
  getCollectorProfile,
  getMyProfile,
  getCollectorsByCompany,
  getCollectorStats,
  updateCollectorProfile,
  updateMyProfile,
  changeCollectorStatus,
  markOnDuty,
  markOffDuty,
  verifyCollector,
  suspendCollector,
  getPerformanceMetrics,
  updatePerformance,
  getTopPerformers as getTopPerformersController,
  assignRoute,
  getMyAssignments,
  getAssignmentsByDateRange,
  updateAssignmentStatus,
  removeCollector,
  searchCollectors,
  getCollectorCompleteInfo,
  registerDriver,
  getDriverProfile,
  getCompanyDrivers,
  updateDriver,
  registerManager,
  getManagerProfile,
  getCompanyManagers,
  getManagerTeam,
  updateManager,
  getCollectorsByRoleController,
} from "../controllers/wasteCollectorController";
import { authenticate, authorizeAdmin } from "../middleware/auth";

const router = Router();

// ─── Public / Auth Routes ───────────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/register:
 *   post:
 *     summary: Complete one-time waste collector registration (includes role-specific data)
 *     description: Register a waste collector with ALL information at once. No need to register again. Automatically creates role-specific profiles for drivers and managers.
 *     tags: [Waste Collectors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - company_id
 *               - company_name
 *               - employee_id
 *               - full_name
 *               - email
 *               - phone
 *               - hire_date
 *               - contract_type
 *               - role
 *             properties:
 *               user_id:
 *                 type: number
 *                 description: User ID from auth system
 *               company_id:
 *                 type: number
 *               employee_id:
 *                 type: string
 *                 description: Unique ID (e.g., WC001)
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [driver, manager, supervisor]
 *               identification_type:
 *                 type: string
 *               identification_number:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               hire_date:
 *                 type: string
 *                 format: date
 *               salary:
 *                 type: number
 *               contract_type:
 *                 type: string
 *               vehicle_id:
 *                 type: number
 *               assigned_zone_id:
 *                 type: number
 *               license_type:
 *                 type: string
 *                 enum: [A, B, C, D, E]
 *                 description: Required for drivers
 *               license_number:
 *                 type: string
 *                 description: Required for drivers
 *               license_expiry:
 *                 type: string
 *                 format: date
 *                 description: Required for drivers
 *               vehicle_registration:
 *                 type: string
 *               driving_experience_years:
 *                 type: number
 *               manages_team:
 *                 type: boolean
 *                 description: For managers
 *               team_size:
 *                 type: number
 *                 description: For managers
 *               supervisor_id:
 *                 type: number
 *                 description: For managers
 *               department:
 *                 type: string
 *                 description: Required for managers
 *               qualifications:
 *                 type: string
 *                 description: For managers
 *     responses:
 *       201:
 *         description: Collector registered successfully with complete profile
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Employee ID already exists
 */
router.post("/register", registerCollector);

// ─── Collector Profile Routes ───────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/profile:
 *   get:
 *     summary: Get my collector profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Collector profile
 *       404:
 *         description: Collector not found
 */
router.get("/profile", authenticate, getMyProfile);

/**
 * @swagger
 * /api/waste-collectors/profile:
 *   put:
 *     summary: Update my profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               assigned_zone_id:
 *                 type: number
 *     responses:
 *       200:
 *         description: Profile updated
 *       404:
 *         description: Profile not found
 */
router.put("/profile", authenticate, updateMyProfile);

/**
 * @swagger
 * /api/waste-collectors/{id}:
 *   get:
 *     summary: Get collector profile by ID
 *     tags: [Profile]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Collector profile
 *       404:
 *         description: Collector not found
 */
router.get("/:id", authenticate, getCollectorProfile);

/**
 * @swagger
 * /api/waste-collectors/{id}/complete-info:
 *   get:
 *     summary: Get complete collector information with performance and assignments
 *     tags: [Profile]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Complete collector information including profile, performance metrics, and recent assignments
 *       404:
 *         description: Collector not found
 */
router.get("/:id/complete-info", authenticate, getCollectorCompleteInfo);

/**
 * @swagger
 * /api/waste-collectors/{id}:
 *   put:
 *     summary: Update collector profile (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Collector updated
 *       404:
 *         description: Collector not found
 */
router.put("/:id", authenticate, updateCollectorProfile);

/**
 * @swagger
 * /api/waste-collectors/{id}:
 *   delete:
 *     summary: Remove collector (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Collector removed
 *       404:
 *         description: Collector not found
 */
router.delete("/:id", authenticate, removeCollector);

// ─── Company Management Routes ───────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/company/{company_id}:
 *   get:
 *     summary: Get all collectors for a company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: company_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, inactive, on_duty, off_duty, suspended]
 *       - name: zone_id
 *         in: query
 *         schema:
 *           type: number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *       - name: offset
 *         in: query
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of collectors
 */
router.get("/company/:company_id", authenticate, getCollectorsByCompany);

/**
 * @swagger
 * /api/waste-collectors/company/{company_id}/stats:
 *   get:
 *     summary: Get collector statistics
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: company_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *       - name: start_date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - name: end_date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Collector statistics
 */
router.get("/company/:company_id/stats", authenticate, getCollectorStats);

/**
 * @swagger
 * /api/waste-collectors/company/{company_id}/search:
 *   get:
 *     summary: Search collectors
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: company_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: verification_status
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/company/:company_id/search", authenticate, searchCollectors);

// ─── Status Management Routes ──────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/status/on-duty:
 *   post:
 *     summary: Mark myself as on-duty
 *     tags: [Status]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marked as on-duty
 */
router.post("/status/on-duty", authenticate, markOnDuty);

/**
 * @swagger
 * /api/waste-collectors/status/off-duty:
 *   post:
 *     summary: Mark myself as off-duty
 *     tags: [Status]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marked as off-duty
 */
router.post("/status/off-duty", authenticate, markOffDuty);

/**
 * @swagger
 * /api/waste-collectors/{id}/status:
 *   put:
 *     summary: Change collector status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, on_duty, off_duty, suspended]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put("/:id/status", authenticate, changeCollectorStatus);

/**
 * @swagger
 * /api/waste-collectors/{id}/suspend:
 *   post:
 *     summary: Suspend a collector (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Collector suspended
 */
router.post("/:id/suspend", authenticate, suspendCollector);

// ─── Verification Routes ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/{id}/verify:
 *   post:
 *     summary: Verify collector documents (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, rejected, pending]
 *     responses:
 *       200:
 *         description: Verification status updated
 */
router.post("/:id/verify", authenticate, verifyCollector);

// ─── Performance Routes ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/{id}/performance:
 *   get:
 *     summary: Get collector performance metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Performance history
 */
router.get("/:id/performance", authenticate, getPerformanceMetrics);

/**
 * @swagger
 * /api/waste-collectors/{id}/performance:
 *   put:
 *     summary: Update collector performance metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *               successful_collections:
 *                 type: number
 *               failed_collections:
 *                 type: number
 *               average_time_per_collection:
 *                 type: number
 *               customer_rating:
 *                 type: number
 *               completion_rate:
 *                 type: number
 *               on_time_rate:
 *                 type: number
 *               total_weight_collected:
 *                 type: number
 *     responses:
 *       200:
 *         description: Metrics updated
 */
router.put("/:id/performance", authenticate, updatePerformance);

/**
 * @swagger
 * /api/waste-collectors/company/{company_id}/top-performers:
 *   get:
 *     summary: Get top performing collectors
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: company_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *       - name: month
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Top performers
 */
router.get("/company/:company_id/top-performers", authenticate, getTopPerformersController);

// ─── Assignment Routes ─────────────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/assignments:
 *   post:
 *     summary: Assign a route to a collector
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collector_id:
 *                 type: number
 *               route_id:
 *                 type: number
 *               schedule_id:
 *                 type: number
 *               assignment_date:
 *                 type: string
 *                 format: date
 *               collection_count:
 *                 type: number
 *               waste_collected_kg:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Route assigned
 */
router.post("/assignments", authenticate, assignRoute);

/**
 * @swagger
 * /api/waste-collectors/my-assignments:
 *   get:
 *     summary: Get my assignments
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments
 */
router.get("/my-assignments", authenticate, getMyAssignments);

/**
 * @swagger
 * /api/waste-collectors/{id}/assignments:
 *   get:
 *     summary: Get assignments by date
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *       - name: date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of assignments
 */
router.get("/:id/assignments", authenticate, getAssignmentsByDateRange);

/**
 * @swagger
 * /api/waste-collectors/assignments/{assignment_id}:
 *   put:
 *     summary: Update assignment status
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: assignment_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [assigned, in_progress, completed, cancelled]
 *               collection_count:
 *                 type: number
 *               waste_collected_kg:
 *                 type: number
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment updated
 */
router.put("/assignments/:assignment_id", authenticate, updateAssignmentStatus);

// ─── Driver Routes ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/drivers/register:
 *   post:
 *     summary: Register driver information
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collector_id:
 *                 type: number
 *               license_type:
 *                 type: string
 *               license_number:
 *                 type: string
 *               license_expiry:
 *                 type: string
 *                 format: date
 *               vehicle_registration:
 *                 type: string
 *               driving_experience_years:
 *                 type: number
 *     responses:
 *       201:
 *         description: Driver registered
 */
router.post("/drivers/register", authenticate, registerDriver);

/**
 * @swagger
 * /api/waste-collectors/drivers/{id}:
 *   get:
 *     summary: Get driver profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Driver profile
 */
router.get("/drivers/:id", authenticate, getDriverProfile);

/**
 * @swagger
 * /api/waste-collectors/drivers/{id}:
 *   put:
 *     summary: Update driver information
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Driver updated
 */
router.put("/drivers/:id", authenticate, updateDriver);

/**
 * @swagger
 * /api/waste-collectors/company/{company_id}/drivers:
 *   get:
 *     summary: Get all drivers for a company
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: company_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of drivers
 */
router.get("/company/:company_id/drivers", authenticate, getCompanyDrivers);

// ─── Manager Routes ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/managers/register:
 *   post:
 *     summary: Register manager information
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collector_id:
 *                 type: number
 *               manages_team:
 *                 type: boolean
 *               team_size:
 *                 type: number
 *               supervisor_id:
 *                 type: number
 *               department:
 *                 type: string
 *               qualifications:
 *                 type: string
 *     responses:
 *       201:
 *         description: Manager registered
 */
router.post("/managers/register", authenticate, registerManager);

/**
 * @swagger
 * /api/waste-collectors/managers/{id}:
 *   get:
 *     summary: Get manager profile
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Manager profile
 */
router.get("/managers/:id", authenticate, getManagerProfile);

/**
 * @swagger
 * /api/waste-collectors/managers/{id}:
 *   put:
 *     summary: Update manager information
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Manager updated
 */
router.put("/managers/:id", authenticate, updateManager);

/**
 * @swagger
 * /api/waste-collectors/company/{company_id}/managers:
 *   get:
 *     summary: Get all managers for a company
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: company_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of managers
 */
router.get("/company/:company_id/managers", authenticate, getCompanyManagers);

/**
 * @swagger
 * /api/waste-collectors/managers/{manager_id}/team:
 *   get:
 *     summary: Get manager's team members
 *     tags: [Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: manager_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of team members
 */
router.get("/managers/:manager_id/team", authenticate, getManagerTeam);

// ─── Filter by Role ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/waste-collectors/company/{company_id}/by-role:
 *   get:
 *     summary: Get collectors by role
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: company_id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *       - name: role
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [driver, manager, supervisor]
 *     responses:
 *       200:
 *         description: List of collectors by role
 */
router.get("/company/:company_id/by-role", authenticate, getCollectorsByRoleController);

export default router;
