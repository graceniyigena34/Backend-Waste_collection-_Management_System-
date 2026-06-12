import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getAssignmentsByCompany,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../models/assignmentModel";
import { pool } from "../config/db";

// GET /api/assignments/company/:companyId
export const listAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = Number(req.params.companyId);
  if (!companyId || isNaN(companyId)) {
    res.status(400).json({ message: "Invalid company id" });
    return;
  }
  const assignments = await getAssignmentsByCompany(companyId);
  res.json({ assignments });
};

// POST /api/assignments
export const addAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { company_id, driver_id, vehicle_id, zone, notes } = req.body as {
    company_id: number; driver_id: number; vehicle_id: number; zone: string; notes?: string;
  };

  if (!company_id || !driver_id || !vehicle_id || !zone?.trim()) {
    res.status(400).json({ message: "company_id, driver_id, vehicle_id and zone are required" });
    return;
  }

  // Verify driver and vehicle belong to this company
  const driverCheck = await pool.query(
    `SELECT id FROM company_drivers WHERE id = $1 AND company_id = $2`, [driver_id, company_id],
  );
  const vehicleCheck = await pool.query(
    `SELECT id FROM company_vehicles WHERE id = $1 AND company_id = $2`, [vehicle_id, company_id],
  );
  if (!driverCheck.rows[0] || !vehicleCheck.rows[0]) {
    res.status(400).json({ message: "Driver or vehicle does not belong to this company" });
    return;
  }

  const assignment = await createAssignment(company_id, driver_id, vehicle_id, zone.trim(), notes);
  res.status(201).json({ message: "Assignment created", assignment });
};

// PATCH /api/assignments/:id
export const editAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { company_id, driver_id, vehicle_id, zone, notes } = req.body as {
    company_id: number; driver_id?: number; vehicle_id?: number; zone?: string; notes?: string;
  };

  if (!id || isNaN(id) || !company_id) {
    res.status(400).json({ message: "Invalid id or company_id" });
    return;
  }

  const updated = await updateAssignment(company_id, id, { driver_id, vehicle_id, zone, notes });
  if (!updated) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  res.json({ message: "Assignment updated", assignment: updated });
};

// DELETE /api/assignments/:id
export const removeAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const companyId = Number(req.query.company_id);

  if (!id || isNaN(id) || !companyId || isNaN(companyId)) {
    res.status(400).json({ message: "Invalid id or company_id" });
    return;
  }

  const deleted = await deleteAssignment(companyId, id);
  if (!deleted) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  res.json({ message: "Assignment deleted" });
};
