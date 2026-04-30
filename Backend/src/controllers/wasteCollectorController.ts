import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createWasteCollector,
  getWasteCollectorById,
  getWasteCollectorByUserId,
  getWasteCollectorByEmployeeId,
  getWasteCollectorsByCompany,
  getWasteCollectorsByStatus,
  getWasteCollectorsByZone,
  updateWasteCollector,
  updateCollectorStatus,
  updateCollectorVerification,
  deleteWasteCollector,
  getAllWasteCollectors,
  getOrCreatePerformanceMetrics,
  updatePerformanceMetrics,
  getPerformanceHistory,
  assignCollectorToRoute,
  getCollectorAssignments,
  getAssignmentsByDate,
  updateAssignment,
  getAssignmentStats,
  getTopPerformers as getTopPerformersData,
  createDriver,
  getDriverInfo,
  getDriversByCompany,
  updateDriverInfo,
  createManager,
  getManagerInfo,
  getManagersByCompany,
  getTeamByManager,
  updateManagerInfo,
  getCollectorsByRole,
  WasteCollector,
  CollectorStatus,
  VerificationStatus,
  CollectorRole,
  DriverLicenseType,
} from "../models/wasteCollectorModel";

// ─── Create & Register Collector (Complete Profile) ────────────────────────

/**
 * Comprehensive one-time registration for waste collectors
 * Handles all profile data in a single call - no need to register again
 */
export const registerCollector = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      user_id,
      company_id,
      company_name,
      employee_id,
      full_name,
      email,
      phone,
      role = "driver",
      identification_type,
      identification_number,
      date_of_birth,
      address,
      hire_date,
      salary,
      contract_type,
      vehicle_id,
      assigned_zone_id,
      // Driver-specific fields
      license_type,
      license_number,
      license_expiry,
      vehicle_registration,
      driving_experience_years,
      // Manager-specific fields
      manages_team,
      team_size,
      supervisor_id,
      department,
      qualifications,
    } = req.body;

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
    const existing = await getWasteCollectorByEmployeeId(employee_id);
    if (existing) {
      res.status(409).json({ message: "Employee ID already registered" });
      return;
    }

    // Create base collector profile
    const collector = await createWasteCollector({
      user_id,
      company_id,
      employee_id,
      full_name,
      email,
      phone,
      role: role as CollectorRole,
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
    let roleData: any = null;

    if (role === "driver") {
      roleData = await createDriver(collector.id, {
        license_type: license_type as DriverLicenseType,
        license_number,
        license_expiry: new Date(license_expiry),
        vehicle_registration,
        driving_experience_years,
      });
    } else if (role === "manager") {
      roleData = await createManager(collector.id, {
        manages_team: manages_team || false,
        team_size: team_size || 0,
        supervisor_id,
        department,
        qualifications,
      });
    }

    // Get complete profile with role-specific data
    const completeProfile = await getCollectorCompleteProfileData(collector.id);

    res.status(201).json({
      message: "Collector registered successfully with complete profile",
      collector: {
        ...completeProfile,
        company_name: company_name ? String(company_name).trim() : undefined,
      },
    });
  } catch (error: any) {
    console.error("Error registering collector:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Helper function to get complete collector profile with role-specific data
 */
export const getCollectorCompleteProfileData = async (collector_id: number): Promise<any> => {
  const collector = await getWasteCollectorById(collector_id);
  if (!collector) return null;

  let roleData = null;
  if (collector.role === "driver") {
    roleData = await getDriverInfo(collector_id);
  } else if (collector.role === "manager") {
    roleData = await getManagerInfo(collector_id);
  }

  return {
    ...collector,
    roleData,
  };
};

// ─── Get Collector Details ───────────────────────────────────────────────────

export const getCollectorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const completeProfile = await getCollectorCompleteProfileData(Number(id));

    if (!completeProfile) {
      res.status(404).json({ message: "Collector not found" });
      return;
    }

    res.json(completeProfile);
  } catch (error: any) {
    console.error("Error fetching collector:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const collector = await getWasteCollectorByUserId(req.user!.id);

    if (!collector) {
      res.status(404).json({ message: "Collector profile not found" });
      return;
    }

    const completeProfile = await getCollectorCompleteProfileData(collector.id);
    res.json(completeProfile);
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getCollectorsByCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id } = req.params;
    const { status, zone_id, limit = "50", offset = "0" } = req.query;

    let collectors: any[];

    if (zone_id) {
      collectors = await getWasteCollectorsByZone(Number(company_id), Number(zone_id));
    } else if (status) {
      collectors = await getWasteCollectorsByStatus(Number(company_id), status as CollectorStatus);
    } else {
      collectors = await getAllWasteCollectors(Number(company_id), Number(limit), Number(offset));
    }

    res.json({
      count: collectors.length,
      collectors,
    });
  } catch (error: any) {
    console.error("Error fetching collectors:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getCollectorStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({ message: "start_date and end_date are required" });
      return;
    }

    const stats = await getAssignmentStats(
      Number(company_id),
      new Date(start_date as string),
      new Date(end_date as string)
    );

    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Update Collector ────────────────────────────────────────────────────────

export const updateCollectorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow direct status changes through this endpoint
    delete updates.status;
    delete updates.verification_status;

    const updated = await updateWasteCollector(Number(id), updates);

    if (!updated) {
      res.status(404).json({ message: "Collector not found" });
      return;
    }

    res.json({ message: "Collector updated successfully", collector: updated });
  } catch (error: any) {
    console.error("Error updating collector:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, address, assigned_zone_id } = req.body;

    const collector = await getWasteCollectorByUserId(req.user!.id);
    if (!collector) {
      res.status(404).json({ message: "Collector profile not found" });
      return;
    }

    const updates: Partial<WasteCollector> = {};
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (assigned_zone_id !== undefined) updates.assigned_zone_id = assigned_zone_id;

    const updated = await updateWasteCollector(collector.id, updates);
    res.json({ message: "Profile updated successfully", collector: updated });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Status Management ───────────────────────────────────────────────────────

export const changeCollectorStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !["active", "inactive", "on_duty", "off_duty", "suspended"].includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const collector = await getWasteCollectorById(Number(id));
    if (!collector) {
      res.status(404).json({ message: "Collector not found" });
      return;
    }

    const updated = await updateCollectorStatus(Number(id), status as CollectorStatus);

    // Log status change
    console.log(`Collector ${id} status changed to ${status}${reason ? `: ${reason}` : ""}`);

    res.json({ message: "Status updated successfully", collector: updated });
  } catch (error: any) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const markOnDuty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const collector = await getWasteCollectorByUserId(req.user!.id);
    if (!collector) {
      res.status(404).json({ message: "Collector profile not found" });
      return;
    }

    const updated = await updateCollectorStatus(collector.id, "on_duty");
    res.json({ message: "Marked as on-duty", collector: updated });
  } catch (error: any) {
    console.error("Error marking on duty:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const markOffDuty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const collector = await getWasteCollectorByUserId(req.user!.id);
    if (!collector) {
      res.status(404).json({ message: "Collector profile not found" });
      return;
    }

    const updated = await updateCollectorStatus(collector.id, "off_duty");
    res.json({ message: "Marked as off-duty", collector: updated });
  } catch (error: any) {
    console.error("Error marking off duty:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Verification Management ────────────────────────────────────────────────

export const verifyCollector = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["verified", "rejected", "pending"].includes(status)) {
      res.status(400).json({ message: "Invalid verification status" });
      return;
    }

    const collector = await getWasteCollectorById(Number(id));
    if (!collector) {
      res.status(404).json({ message: "Collector not found" });
      return;
    }

    const updated = await updateCollectorVerification(Number(id), status as VerificationStatus);

    if (status === "verified") {
      // Update documents_verified flag
      await updateWasteCollector(Number(id), { documents_verified: true });
    }

    res.json({ message: `Collector verification status updated to ${status}`, collector: updated });
  } catch (error: any) {
    console.error("Error verifying collector:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const suspendCollector = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const collector = await getWasteCollectorById(Number(id));
    if (!collector) {
      res.status(404).json({ message: "Collector not found" });
      return;
    }

    const updated = await updateCollectorStatus(Number(id), "suspended");
    console.log(`Collector ${id} suspended${reason ? `: ${reason}` : ""}`);

    res.json({ message: "Collector suspended successfully", collector: updated });
  } catch (error: any) {
    console.error("Error suspending collector:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Performance Tracking ────────────────────────────────────────────────────

export const getPerformanceMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const history = await getPerformanceHistory(Number(id));

    if (history.length === 0) {
      res.json({ message: "No performance data available", history: [] });
      return;
    }

    res.json(history);
  } catch (error: any) {
    console.error("Error fetching performance:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updatePerformance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { month, successful_collections, failed_collections, average_time_per_collection, customer_rating, completion_rate, on_time_rate, total_weight_collected } = req.body;

    if (!month) {
      res.status(400).json({ message: "Month is required (format: YYYY-MM)" });
      return;
    }

    const metrics = await getOrCreatePerformanceMetrics(Number(id), month);
    const updated = await updatePerformanceMetrics(Number(id), month, {
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
      await updateWasteCollector(Number(id), { performance_rating: customer_rating });
    }

    res.json({ message: "Performance metrics updated", metrics: updated });
  } catch (error: any) {
    console.error("Error updating performance:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getTopPerformers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id } = req.params;
    const { month } = req.query;

    if (!month) {
      res.status(400).json({ message: "Month is required (format: YYYY-MM)" });
      return;
    }

    const topPerformers = await getTopPerformersData(Number(company_id), month as string);
    res.json(topPerformers);
  } catch (error: any) {
    console.error("Error fetching top performers:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Route Assignment ────────────────────────────────────────────────────────

export const assignRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { collector_id, route_id, schedule_id, assignment_date, collection_count = 0, waste_collected_kg = 0, notes } = req.body;

    if (!collector_id || !assignment_date) {
      res.status(400).json({ message: "collector_id and assignment_date are required" });
      return;
    }

    const collector = await getWasteCollectorById(collector_id);
    if (!collector) {
      res.status(404).json({ message: "Collector not found" });
      return;
    }

    const assignment = await assignCollectorToRoute({
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
    await updateWasteCollector(collector_id, { active_routes: (collector.active_routes || 0) + 1 });

    res.status(201).json({ message: "Route assigned successfully", assignment });
  } catch (error: any) {
    console.error("Error assigning route:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getMyAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const collector = await getWasteCollectorByUserId(req.user!.id);
    if (!collector) {
      res.status(404).json({ message: "Collector profile not found" });
      return;
    }

    const assignments = await getCollectorAssignments(collector.id);
    res.json(assignments);
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getAssignmentsByDateRange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      res.status(400).json({ message: "date is required (format: YYYY-MM-DD)" });
      return;
    }

    const assignments = await getAssignmentsByDate(Number(id), new Date(date as string));
    res.json(assignments);
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateAssignmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignment_id } = req.params;
    const { status, collection_count, waste_collected_kg, end_time, notes } = req.body;

    if (!status || !["assigned", "in_progress", "completed", "cancelled"].includes(status)) {
      res.status(400).json({ message: "Invalid assignment status" });
      return;
    }

    const updates: any = { status };
    if (collection_count !== undefined) updates.collection_count = collection_count;
    if (waste_collected_kg !== undefined) updates.waste_collected_kg = waste_collected_kg;
    if (end_time !== undefined) updates.end_time = end_time;
    if (notes !== undefined) updates.notes = notes;

    const updated = await updateAssignment(Number(assignment_id), updates);

    if (!updated) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    res.json({ message: "Assignment updated successfully", assignment: updated });
  } catch (error: any) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Delete Collector ────────────────────────────────────────────────────────

export const removeCollector = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const collector = await getWasteCollectorById(Number(id));
    if (!collector) {
      res.status(404).json({ message: "Collector not found" });
      return;
    }

    const deleted = await deleteWasteCollector(Number(id));

    if (!deleted) {
      res.status(400).json({ message: "Failed to delete collector" });
      return;
    }

    console.log(`Collector ${id} deleted${reason ? `: ${reason}` : ""}`);
    res.json({ message: "Collector removed successfully" });
  } catch (error: any) {
    console.error("Error deleting collector:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Search & Filter ────────────────────────────────────────────────────────

export const searchCollectors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id } = req.params;
    const { query, status, verification_status } = req.query;

    let collectors = await getWasteCollectorsByCompany(Number(company_id));

    if (status) {
      collectors = collectors.filter((c) => c.status === status);
    }

    if (verification_status) {
      collectors = collectors.filter((c) => c.verification_status === verification_status);
    }

    if (query) {
      const q = (query as string).toLowerCase();
      collectors = collectors.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.employee_id.includes(q)
      );
    }

    res.json({ count: collectors.length, collectors });
  } catch (error: any) {
    console.error("Error searching collectors:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Get Comprehensive Collector Information ──────────────────────────────

export const getCollectorCompleteInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get collector profile
    const collector = await getWasteCollectorById(Number(id));
    if (!collector) {
      res.status(404).json({ message: "Collector not found" });
      return;
    }

    // Get performance history
    const performanceHistory = await getPerformanceHistory(Number(id));

    // Get recent assignments
    const recentAssignments = await getCollectorAssignments(Number(id));

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
  } catch (error: any) {
    console.error("Error fetching complete collector info:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Waste Collector Drivers ───────────────────────────────────────────────

export const registerDriver = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { collector_id, license_type, license_number, license_expiry, vehicle_registration, driving_experience_years } = req.body;

    if (!collector_id || !license_type || !license_number || !license_expiry) {
      res.status(400).json({ message: "Missing required driver fields" });
      return;
    }

    // Verify collector exists and is a driver
    const collector = await getWasteCollectorById(collector_id);
    if (!collector || collector.role !== "driver") {
      res.status(404).json({ message: "Driver not found or collector is not a driver" });
      return;
    }

    const driver = await createDriver(collector_id, {
      license_type: license_type as any,
      license_number,
      license_expiry: new Date(license_expiry),
      vehicle_registration,
      driving_experience_years,
    });

    res.status(201).json({ message: "Driver info registered successfully", driver });
  } catch (error: any) {
    console.error("Error registering driver:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getDriverProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const driver = await getDriverInfo(Number(id));

    if (!driver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }

    res.json(driver);
  } catch (error: any) {
    console.error("Error fetching driver:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getCompanyDrivers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id } = req.params;
    const drivers = await getDriversByCompany(Number(company_id));

    res.json({
      count: drivers.length,
      drivers,
    });
  } catch (error: any) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateDriver = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { license_type, license_number, license_expiry, vehicle_registration, driving_experience_years } = req.body;

    const updates: any = {};
    if (license_type) updates.license_type = license_type;
    if (license_number) updates.license_number = license_number;
    if (license_expiry) updates.license_expiry = license_expiry;
    if (vehicle_registration) updates.vehicle_registration = vehicle_registration;
    if (driving_experience_years !== undefined) updates.driving_experience_years = driving_experience_years;

    const updated = await updateDriverInfo(Number(id), updates);

    if (!updated) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }

    res.json({ message: "Driver info updated successfully", driver: updated });
  } catch (error: any) {
    console.error("Error updating driver:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── Waste Collector Managers ────────────────────────────────────────────

export const registerManager = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { collector_id, manages_team, team_size, supervisor_id, department, qualifications } = req.body;

    if (!collector_id || !department) {
      res.status(400).json({ message: "Missing required manager fields" });
      return;
    }

    // Verify collector exists and is a manager
    const collector = await getWasteCollectorById(collector_id);
    if (!collector || collector.role !== "manager") {
      res.status(404).json({ message: "Manager not found or collector is not a manager" });
      return;
    }

    const manager = await createManager(collector_id, {
      manages_team: manages_team || false,
      team_size: team_size || 0,
      supervisor_id,
      department,
      qualifications,
    });

    res.status(201).json({ message: "Manager info registered successfully", manager });
  } catch (error: any) {
    console.error("Error registering manager:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getManagerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const manager = await getManagerInfo(Number(id));

    if (!manager) {
      res.status(404).json({ message: "Manager not found" });
      return;
    }

    res.json(manager);
  } catch (error: any) {
    console.error("Error fetching manager:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getCompanyManagers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id } = req.params;
    const managers = await getManagersByCompany(Number(company_id));

    res.json({
      count: managers.length,
      managers,
    });
  } catch (error: any) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getManagerTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { manager_id } = req.params;
    const team = await getTeamByManager(Number(manager_id));

    res.json({
      count: team.length,
      team,
    });
  } catch (error: any) {
    console.error("Error fetching team:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateManager = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { manages_team, team_size, supervisor_id, department, qualifications } = req.body;

    const updates: any = {};
    if (manages_team !== undefined) updates.manages_team = manages_team;
    if (team_size !== undefined) updates.team_size = team_size;
    if (supervisor_id !== undefined) updates.supervisor_id = supervisor_id;
    if (department) updates.department = department;
    if (qualifications) updates.qualifications = qualifications;

    const updated = await updateManagerInfo(Number(id), updates);

    if (!updated) {
      res.status(404).json({ message: "Manager not found" });
      return;
    }

    res.json({ message: "Manager info updated successfully", manager: updated });
  } catch (error: any) {
    console.error("Error updating manager:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getCollectorsByRoleController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { company_id } = req.params;
    const { role } = req.query;

    if (!role || !["driver", "manager", "supervisor"].includes(role as string)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const collectors = await getCollectorsByRole(Number(company_id), role as CollectorRole);

    res.json({
      role,
      count: collectors.length,
      collectors,
    });
  } catch (error: any) {
    console.error("Error fetching collectors by role:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
