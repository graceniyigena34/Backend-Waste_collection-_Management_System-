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
exports.getCollectorsByRoleController = exports.updateManager = exports.getManagerTeam = exports.getCompanyManagers = exports.getManagerProfile = exports.registerManager = exports.updateDriver = exports.getCompanyDrivers = exports.getDriverProfile = exports.registerDriver = exports.getCollectorCompleteInfo = exports.searchCollectors = exports.removeCollector = exports.updateAssignmentStatus = exports.getAssignmentsByDateRange = exports.getMyAssignments = exports.assignRoute = exports.getTopPerformers = exports.updatePerformance = exports.getPerformanceMetrics = exports.suspendCollector = exports.verifyCollector = exports.markOffDuty = exports.markOnDuty = exports.changeCollectorStatus = exports.updateMyProfile = exports.updateCollectorProfile = exports.getCollectorStats = exports.getCollectorsByCompany = exports.getMyProfile = exports.getCollectorProfile = exports.getCollectorCompleteProfileData = exports.registerCollector = void 0;
const wasteCollectorModel_1 = require("../models/wasteCollectorModel");
// ─── Create & Register Collector (Complete Profile) ────────────────────────
/**
 * Comprehensive one-time registration for waste collectors
 * Handles all profile data in a single call - no need to register again
 */
const registerCollector = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, company_id, company_name, employee_id, full_name, email, phone, role = "driver", identification_type, identification_number, date_of_birth, address, hire_date, salary, contract_type, vehicle_id, assigned_zone_id, 
        // Driver-specific fields
        license_type, license_number, license_expiry, vehicle_registration, driving_experience_years, 
        // Manager-specific fields
        manages_team, team_size, supervisor_id, department, qualifications, } = req.body;
        // Validate required fields
        if (!user_id || !company_id || !employee_id || !full_name || !email || !phone || !hire_date || !contract_type) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        // Validate role-specific required fields
        if (role === "driver" && (!license_type || !license_number || !license_expiry)) {
            res.status(400).json({ message: "Driver role requires license_type, license_number, and license_expiry" });
            return;
        }
        if (role === "manager" && !department) {
            res.status(400).json({ message: "Manager role requires department" });
            return;
        }
        // Check if employee_id already exists
        const existing = yield (0, wasteCollectorModel_1.getWasteCollectorByEmployeeId)(employee_id);
        if (existing) {
            res.status(409).json({ message: "Employee ID already registered" });
            return;
        }
        // Create base collector profile
        const collector = yield (0, wasteCollectorModel_1.createWasteCollector)({
            user_id,
            company_id,
            employee_id,
            full_name,
            email,
            phone,
            role: role,
            status: "active",
            verification_status: "pending",
            identification_type,
            identification_number,
            date_of_birth: new Date(date_of_birth),
            address,
            assigned_zone_id,
            hire_date: new Date(hire_date),
            salary,
            contract_type,
            vehicle_id,
            documents_verified: false,
            performance_rating: 0,
            total_collections: 0,
            active_routes: 0,
        });
        // Register role-specific information
        let roleData = null;
        if (role === "driver") {
            roleData = yield (0, wasteCollectorModel_1.createDriver)(collector.id, {
                license_type: license_type,
                license_number,
                license_expiry: new Date(license_expiry),
                vehicle_registration,
                driving_experience_years,
            });
        }
        else if (role === "manager") {
            roleData = yield (0, wasteCollectorModel_1.createManager)(collector.id, {
                manages_team: manages_team || false,
                team_size: team_size || 0,
                supervisor_id,
                department,
                qualifications,
            });
        }
        // Get complete profile with role-specific data
        const completeProfile = yield (0, exports.getCollectorCompleteProfileData)(collector.id);
        res.status(201).json({
            message: "Collector registered successfully with complete profile",
            collector: Object.assign(Object.assign({}, completeProfile), { company_name: company_name ? String(company_name).trim() : undefined }),
        });
    }
    catch (error) {
        console.error("Error registering collector:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.registerCollector = registerCollector;
/**
 * Helper function to get complete collector profile with role-specific data
 */
const getCollectorCompleteProfileData = (collector_id) => __awaiter(void 0, void 0, void 0, function* () {
    const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(collector_id);
    if (!collector)
        return null;
    let roleData = null;
    if (collector.role === "driver") {
        roleData = yield (0, wasteCollectorModel_1.getDriverInfo)(collector_id);
    }
    else if (collector.role === "manager") {
        roleData = yield (0, wasteCollectorModel_1.getManagerInfo)(collector_id);
    }
    return Object.assign(Object.assign({}, collector), { roleData });
});
exports.getCollectorCompleteProfileData = getCollectorCompleteProfileData;
// ─── Get Collector Details ───────────────────────────────────────────────────
const getCollectorProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const completeProfile = yield (0, exports.getCollectorCompleteProfileData)(Number(id));
        if (!completeProfile) {
            res.status(404).json({ message: "Collector not found" });
            return;
        }
        res.json(completeProfile);
    }
    catch (error) {
        console.error("Error fetching collector:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getCollectorProfile = getCollectorProfile;
const getMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorByUserId)(req.user.id);
        if (!collector) {
            res.status(404).json({ message: "Collector profile not found" });
            return;
        }
        const completeProfile = yield (0, exports.getCollectorCompleteProfileData)(collector.id);
        res.json(completeProfile);
    }
    catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getMyProfile = getMyProfile;
const getCollectorsByCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company_id } = req.params;
        const { status, zone_id, limit = "50", offset = "0" } = req.query;
        let collectors;
        if (zone_id) {
            collectors = yield (0, wasteCollectorModel_1.getWasteCollectorsByZone)(Number(company_id), Number(zone_id));
        }
        else if (status) {
            collectors = yield (0, wasteCollectorModel_1.getWasteCollectorsByStatus)(Number(company_id), status);
        }
        else {
            collectors = yield (0, wasteCollectorModel_1.getAllWasteCollectors)(Number(company_id), Number(limit), Number(offset));
        }
        res.json({
            count: collectors.length,
            collectors,
        });
    }
    catch (error) {
        console.error("Error fetching collectors:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getCollectorsByCompany = getCollectorsByCompany;
const getCollectorStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company_id } = req.params;
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            res.status(400).json({ message: "start_date and end_date are required" });
            return;
        }
        const stats = yield (0, wasteCollectorModel_1.getAssignmentStats)(Number(company_id), new Date(start_date), new Date(end_date));
        res.json(stats);
    }
    catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getCollectorStats = getCollectorStats;
// ─── Update Collector ────────────────────────────────────────────────────────
const updateCollectorProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Don't allow direct status changes through this endpoint
        delete updates.status;
        delete updates.verification_status;
        const updated = yield (0, wasteCollectorModel_1.updateWasteCollector)(Number(id), updates);
        if (!updated) {
            res.status(404).json({ message: "Collector not found" });
            return;
        }
        res.json({ message: "Collector updated successfully", collector: updated });
    }
    catch (error) {
        console.error("Error updating collector:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.updateCollectorProfile = updateCollectorProfile;
const updateMyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, address, assigned_zone_id } = req.body;
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorByUserId)(req.user.id);
        if (!collector) {
            res.status(404).json({ message: "Collector profile not found" });
            return;
        }
        const updates = {};
        if (phone)
            updates.phone = phone;
        if (address)
            updates.address = address;
        if (assigned_zone_id !== undefined)
            updates.assigned_zone_id = assigned_zone_id;
        const updated = yield (0, wasteCollectorModel_1.updateWasteCollector)(collector.id, updates);
        res.json({ message: "Profile updated successfully", collector: updated });
    }
    catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.updateMyProfile = updateMyProfile;
// ─── Status Management ───────────────────────────────────────────────────────
const changeCollectorStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        if (!status || !["active", "inactive", "on_duty", "off_duty", "suspended"].includes(status)) {
            res.status(400).json({ message: "Invalid status" });
            return;
        }
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(Number(id));
        if (!collector) {
            res.status(404).json({ message: "Collector not found" });
            return;
        }
        const updated = yield (0, wasteCollectorModel_1.updateCollectorStatus)(Number(id), status);
        // Log status change
        console.log(`Collector ${id} status changed to ${status}${reason ? `: ${reason}` : ""}`);
        res.json({ message: "Status updated successfully", collector: updated });
    }
    catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.changeCollectorStatus = changeCollectorStatus;
const markOnDuty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorByUserId)(req.user.id);
        if (!collector) {
            res.status(404).json({ message: "Collector profile not found" });
            return;
        }
        const updated = yield (0, wasteCollectorModel_1.updateCollectorStatus)(collector.id, "on_duty");
        res.json({ message: "Marked as on-duty", collector: updated });
    }
    catch (error) {
        console.error("Error marking on duty:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.markOnDuty = markOnDuty;
const markOffDuty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorByUserId)(req.user.id);
        if (!collector) {
            res.status(404).json({ message: "Collector profile not found" });
            return;
        }
        const updated = yield (0, wasteCollectorModel_1.updateCollectorStatus)(collector.id, "off_duty");
        res.json({ message: "Marked as off-duty", collector: updated });
    }
    catch (error) {
        console.error("Error marking off duty:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.markOffDuty = markOffDuty;
// ─── Verification Management ────────────────────────────────────────────────
const verifyCollector = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !["verified", "rejected", "pending"].includes(status)) {
            res.status(400).json({ message: "Invalid verification status" });
            return;
        }
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(Number(id));
        if (!collector) {
            res.status(404).json({ message: "Collector not found" });
            return;
        }
        const updated = yield (0, wasteCollectorModel_1.updateCollectorVerification)(Number(id), status);
        if (status === "verified") {
            // Update documents_verified flag
            yield (0, wasteCollectorModel_1.updateWasteCollector)(Number(id), { documents_verified: true });
        }
        res.json({ message: `Collector verification status updated to ${status}`, collector: updated });
    }
    catch (error) {
        console.error("Error verifying collector:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.verifyCollector = verifyCollector;
const suspendCollector = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(Number(id));
        if (!collector) {
            res.status(404).json({ message: "Collector not found" });
            return;
        }
        const updated = yield (0, wasteCollectorModel_1.updateCollectorStatus)(Number(id), "suspended");
        console.log(`Collector ${id} suspended${reason ? `: ${reason}` : ""}`);
        res.json({ message: "Collector suspended successfully", collector: updated });
    }
    catch (error) {
        console.error("Error suspending collector:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.suspendCollector = suspendCollector;
// ─── Performance Tracking ────────────────────────────────────────────────────
const getPerformanceMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const history = yield (0, wasteCollectorModel_1.getPerformanceHistory)(Number(id));
        if (history.length === 0) {
            res.json({ message: "No performance data available", history: [] });
            return;
        }
        res.json(history);
    }
    catch (error) {
        console.error("Error fetching performance:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getPerformanceMetrics = getPerformanceMetrics;
const updatePerformance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { month, successful_collections, failed_collections, average_time_per_collection, customer_rating, completion_rate, on_time_rate, total_weight_collected } = req.body;
        if (!month) {
            res.status(400).json({ message: "Month is required (format: YYYY-MM)" });
            return;
        }
        const metrics = yield (0, wasteCollectorModel_1.getOrCreatePerformanceMetrics)(Number(id), month);
        const updated = yield (0, wasteCollectorModel_1.updatePerformanceMetrics)(Number(id), month, {
            total_collections: (metrics.total_collections || 0) + ((successful_collections || 0) + (failed_collections || 0)),
            successful_collections,
            failed_collections,
            average_time_per_collection,
            customer_rating,
            completion_rate,
            on_time_rate,
            total_weight_collected,
        });
        // Update overall rating on waste_collectors table
        if (customer_rating) {
            yield (0, wasteCollectorModel_1.updateWasteCollector)(Number(id), { performance_rating: customer_rating });
        }
        res.json({ message: "Performance metrics updated", metrics: updated });
    }
    catch (error) {
        console.error("Error updating performance:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.updatePerformance = updatePerformance;
const getTopPerformers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company_id } = req.params;
        const { month } = req.query;
        if (!month) {
            res.status(400).json({ message: "Month is required (format: YYYY-MM)" });
            return;
        }
        const topPerformers = yield (0, wasteCollectorModel_1.getTopPerformers)(Number(company_id), month);
        res.json(topPerformers);
    }
    catch (error) {
        console.error("Error fetching top performers:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getTopPerformers = getTopPerformers;
// ─── Route Assignment ────────────────────────────────────────────────────────
const assignRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { collector_id, route_id, schedule_id, assignment_date, collection_count = 0, waste_collected_kg = 0, notes } = req.body;
        if (!collector_id || !assignment_date) {
            res.status(400).json({ message: "collector_id and assignment_date are required" });
            return;
        }
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(collector_id);
        if (!collector) {
            res.status(404).json({ message: "Collector not found" });
            return;
        }
        const assignment = yield (0, wasteCollectorModel_1.assignCollectorToRoute)({
            collector_id,
            route_id,
            schedule_id,
            assignment_date: new Date(assignment_date),
            status: "assigned",
            collection_count,
            waste_collected_kg,
            notes,
        });
        // Update active routes count
        yield (0, wasteCollectorModel_1.updateWasteCollector)(collector_id, { active_routes: (collector.active_routes || 0) + 1 });
        res.status(201).json({ message: "Route assigned successfully", assignment });
    }
    catch (error) {
        console.error("Error assigning route:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.assignRoute = assignRoute;
const getMyAssignments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorByUserId)(req.user.id);
        if (!collector) {
            res.status(404).json({ message: "Collector profile not found" });
            return;
        }
        const assignments = yield (0, wasteCollectorModel_1.getCollectorAssignments)(collector.id);
        res.json(assignments);
    }
    catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getMyAssignments = getMyAssignments;
const getAssignmentsByDateRange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ message: "date is required (format: YYYY-MM-DD)" });
            return;
        }
        const assignments = yield (0, wasteCollectorModel_1.getAssignmentsByDate)(Number(id), new Date(date));
        res.json(assignments);
    }
    catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getAssignmentsByDateRange = getAssignmentsByDateRange;
const updateAssignmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { assignment_id } = req.params;
        const { status, collection_count, waste_collected_kg, end_time, notes } = req.body;
        if (!status || !["assigned", "in_progress", "completed", "cancelled"].includes(status)) {
            res.status(400).json({ message: "Invalid assignment status" });
            return;
        }
        const updates = { status };
        if (collection_count !== undefined)
            updates.collection_count = collection_count;
        if (waste_collected_kg !== undefined)
            updates.waste_collected_kg = waste_collected_kg;
        if (end_time !== undefined)
            updates.end_time = end_time;
        if (notes !== undefined)
            updates.notes = notes;
        const updated = yield (0, wasteCollectorModel_1.updateAssignment)(Number(assignment_id), updates);
        if (!updated) {
            res.status(404).json({ message: "Assignment not found" });
            return;
        }
        res.json({ message: "Assignment updated successfully", assignment: updated });
    }
    catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.updateAssignmentStatus = updateAssignmentStatus;
// ─── Delete Collector ────────────────────────────────────────────────────────
const removeCollector = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(Number(id));
        if (!collector) {
            res.status(404).json({ message: "Collector not found" });
            return;
        }
        const deleted = yield (0, wasteCollectorModel_1.deleteWasteCollector)(Number(id));
        if (!deleted) {
            res.status(400).json({ message: "Failed to delete collector" });
            return;
        }
        console.log(`Collector ${id} deleted${reason ? `: ${reason}` : ""}`);
        res.json({ message: "Collector removed successfully" });
    }
    catch (error) {
        console.error("Error deleting collector:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.removeCollector = removeCollector;
// ─── Search & Filter ────────────────────────────────────────────────────────
const searchCollectors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company_id } = req.params;
        const { query, status, verification_status } = req.query;
        let collectors = yield (0, wasteCollectorModel_1.getWasteCollectorsByCompany)(Number(company_id));
        if (status) {
            collectors = collectors.filter((c) => c.status === status);
        }
        if (verification_status) {
            collectors = collectors.filter((c) => c.verification_status === verification_status);
        }
        if (query) {
            const q = query.toLowerCase();
            collectors = collectors.filter((c) => c.full_name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                c.employee_id.includes(q));
        }
        res.json({ count: collectors.length, collectors });
    }
    catch (error) {
        console.error("Error searching collectors:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.searchCollectors = searchCollectors;
// ─── Get Comprehensive Collector Information ──────────────────────────────
const getCollectorCompleteInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get collector profile
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(Number(id));
        if (!collector) {
            res.status(404).json({ message: "Collector not found" });
            return;
        }
        // Get performance history
        const performanceHistory = yield (0, wasteCollectorModel_1.getPerformanceHistory)(Number(id));
        // Get recent assignments
        const recentAssignments = yield (0, wasteCollectorModel_1.getCollectorAssignments)(Number(id));
        // Compile comprehensive information
        const completeInfo = {
            profile: collector,
            performanceMetrics: {
                history: performanceHistory,
                currentRating: collector.performance_rating || 0,
                totalCollections: collector.total_collections || 0,
                activeRoutes: collector.active_routes || 0,
            },
            recentAssignments: recentAssignments.slice(0, 10), // Last 10 assignments
            status: {
                current: collector.status,
                verification: collector.verification_status,
                documentsVerified: collector.documents_verified,
            },
            employment: {
                employeeId: collector.employee_id,
                hireDate: collector.hire_date,
                contractType: collector.contract_type,
                salary: collector.salary,
            },
            assignment: {
                assignedZone: collector.assigned_zone_id,
                vehicleId: collector.vehicle_id,
            },
        };
        res.json(completeInfo);
    }
    catch (error) {
        console.error("Error fetching complete collector info:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getCollectorCompleteInfo = getCollectorCompleteInfo;
// ─── Waste Collector Drivers ───────────────────────────────────────────────
const registerDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { collector_id, license_type, license_number, license_expiry, vehicle_registration, driving_experience_years } = req.body;
        if (!collector_id || !license_type || !license_number || !license_expiry) {
            res.status(400).json({ message: "Missing required driver fields" });
            return;
        }
        // Verify collector exists and is a driver
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(collector_id);
        if (!collector || collector.role !== "driver") {
            res.status(404).json({ message: "Driver not found or collector is not a driver" });
            return;
        }
        const driver = yield (0, wasteCollectorModel_1.createDriver)(collector_id, {
            license_type: license_type,
            license_number,
            license_expiry: new Date(license_expiry),
            vehicle_registration,
            driving_experience_years,
        });
        res.status(201).json({ message: "Driver info registered successfully", driver });
    }
    catch (error) {
        console.error("Error registering driver:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.registerDriver = registerDriver;
const getDriverProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const driver = yield (0, wasteCollectorModel_1.getDriverInfo)(Number(id));
        if (!driver) {
            res.status(404).json({ message: "Driver not found" });
            return;
        }
        res.json(driver);
    }
    catch (error) {
        console.error("Error fetching driver:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getDriverProfile = getDriverProfile;
const getCompanyDrivers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company_id } = req.params;
        const drivers = yield (0, wasteCollectorModel_1.getDriversByCompany)(Number(company_id));
        res.json({
            count: drivers.length,
            drivers,
        });
    }
    catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getCompanyDrivers = getCompanyDrivers;
const updateDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { license_type, license_number, license_expiry, vehicle_registration, driving_experience_years } = req.body;
        const updates = {};
        if (license_type)
            updates.license_type = license_type;
        if (license_number)
            updates.license_number = license_number;
        if (license_expiry)
            updates.license_expiry = license_expiry;
        if (vehicle_registration)
            updates.vehicle_registration = vehicle_registration;
        if (driving_experience_years !== undefined)
            updates.driving_experience_years = driving_experience_years;
        const updated = yield (0, wasteCollectorModel_1.updateDriverInfo)(Number(id), updates);
        if (!updated) {
            res.status(404).json({ message: "Driver not found" });
            return;
        }
        res.json({ message: "Driver info updated successfully", driver: updated });
    }
    catch (error) {
        console.error("Error updating driver:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.updateDriver = updateDriver;
// ─── Waste Collector Managers ────────────────────────────────────────────
const registerManager = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { collector_id, manages_team, team_size, supervisor_id, department, qualifications } = req.body;
        if (!collector_id || !department) {
            res.status(400).json({ message: "Missing required manager fields" });
            return;
        }
        // Verify collector exists and is a manager
        const collector = yield (0, wasteCollectorModel_1.getWasteCollectorById)(collector_id);
        if (!collector || collector.role !== "manager") {
            res.status(404).json({ message: "Manager not found or collector is not a manager" });
            return;
        }
        const manager = yield (0, wasteCollectorModel_1.createManager)(collector_id, {
            manages_team: manages_team || false,
            team_size: team_size || 0,
            supervisor_id,
            department,
            qualifications,
        });
        res.status(201).json({ message: "Manager info registered successfully", manager });
    }
    catch (error) {
        console.error("Error registering manager:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.registerManager = registerManager;
const getManagerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const manager = yield (0, wasteCollectorModel_1.getManagerInfo)(Number(id));
        if (!manager) {
            res.status(404).json({ message: "Manager not found" });
            return;
        }
        res.json(manager);
    }
    catch (error) {
        console.error("Error fetching manager:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getManagerProfile = getManagerProfile;
const getCompanyManagers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company_id } = req.params;
        const managers = yield (0, wasteCollectorModel_1.getManagersByCompany)(Number(company_id));
        res.json({
            count: managers.length,
            managers,
        });
    }
    catch (error) {
        console.error("Error fetching managers:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getCompanyManagers = getCompanyManagers;
const getManagerTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { manager_id } = req.params;
        const team = yield (0, wasteCollectorModel_1.getTeamByManager)(Number(manager_id));
        res.json({
            count: team.length,
            team,
        });
    }
    catch (error) {
        console.error("Error fetching team:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getManagerTeam = getManagerTeam;
const updateManager = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { manages_team, team_size, supervisor_id, department, qualifications } = req.body;
        const updates = {};
        if (manages_team !== undefined)
            updates.manages_team = manages_team;
        if (team_size !== undefined)
            updates.team_size = team_size;
        if (supervisor_id !== undefined)
            updates.supervisor_id = supervisor_id;
        if (department)
            updates.department = department;
        if (qualifications)
            updates.qualifications = qualifications;
        const updated = yield (0, wasteCollectorModel_1.updateManagerInfo)(Number(id), updates);
        if (!updated) {
            res.status(404).json({ message: "Manager not found" });
            return;
        }
        res.json({ message: "Manager info updated successfully", manager: updated });
    }
    catch (error) {
        console.error("Error updating manager:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.updateManager = updateManager;
const getCollectorsByRoleController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { company_id } = req.params;
        const { role } = req.query;
        if (!role || !["driver", "manager", "supervisor"].includes(role)) {
            res.status(400).json({ message: "Invalid role" });
            return;
        }
        const collectors = yield (0, wasteCollectorModel_1.getCollectorsByRole)(Number(company_id), role);
        res.json({
            role,
            count: collectors.length,
            collectors,
        });
    }
    catch (error) {
        console.error("Error fetching collectors by role:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
exports.getCollectorsByRoleController = getCollectorsByRoleController;
