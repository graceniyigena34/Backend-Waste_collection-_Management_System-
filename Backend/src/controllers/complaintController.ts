import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createComplaint,
  getComplaintsByUserId,
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintContent,
  deleteComplaint,
  deleteOwnComplaint,
  getComplaintsByDistrict,
  ComplaintStatus,
  ComplaintPriority,
} from "../models/complaintModel";
import { getHouseholdByUserId } from "../models/householdModel";

const VALID_STATUSES: ComplaintStatus[] = ["Pending", "In Progress", "Resolved"];
const VALID_PRIORITIES: ComplaintPriority[] = ["Low", "Medium", "High", "Urgent"];

// POST /api/complaints — citizen submits a complaint
export const submitComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user!.id;
  const { issue_type, description, priority } = req.body;

  if (!issue_type || !description?.trim()) {
    res.status(400).json({ message: "issue_type and description are required" });
    return;
  }

  const household = await getHouseholdByUserId(user_id);
  const safePriority: ComplaintPriority = VALID_PRIORITIES.includes(priority) ? priority : "Medium";

  const complaint = await createComplaint({
    user_id,
    household_id: household?.id,
    issue_type,
    title: issue_type,
    description: description.trim(),
    priority: safePriority,
  });

  res.status(201).json({ message: "Complaint submitted successfully", complaint });
};

// GET /api/complaints/me — citizen gets their complaints
export const getMyComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  const complaints = await getComplaintsByUserId(req.user!.id);
  res.json(complaints);
};

// GET /api/complaints — Admin: get all complaints
export const listAllComplaints = async (_req: AuthRequest, res: Response): Promise<void> => {
  const complaints = await getAllComplaints();
  res.json(complaints);
};

// GET /api/complaints/district/:district — Waste collector sees complaints for their district
export const getDistrictComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  const district = String(req.params.district ?? "").trim();
  if (!district) {
    res.status(400).json({ message: "district parameter is required" });
    return;
  }
  const complaints = await getComplaintsByDistrict(district);
  res.json(complaints);
};

// PATCH /api/complaints/:id/status — Admin updates complaint status
export const patchComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { status, assigned_to, resolution_note } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  const updated = await updateComplaintStatus(id, status, assigned_to, resolution_note);
  if (!updated) {
    res.status(404).json({ message: "Complaint not found" });
    return;
  }
  res.json({ message: "Complaint updated", complaint: updated });
};

// PUT /api/complaints/:id — citizen edits their own Pending complaint
export const editMyComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { issue_type, description, priority } = req.body;

  if (!issue_type && !description?.trim() && !priority) {
    res.status(400).json({ message: "Provide at least one field to update" });
    return;
  }

  const updated = await updateComplaintContent(id, req.user!.id, {
    issue_type,
    description: description?.trim(),
    priority: VALID_PRIORITIES.includes(priority) ? priority : undefined,
  });

  if (!updated) {
    res.status(404).json({ message: "Complaint not found, not yours, or no longer Pending" });
    return;
  }
  res.json({ message: "Complaint updated", complaint: updated });
};

// DELETE /api/complaints/:id — owner (citizen) or admin/waste_collector
export const removeComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const role = req.user!.role;

  const deleted =
    role === "admin" || role === "waste_collector"
      ? await deleteComplaint(id)
      : await deleteOwnComplaint(id, req.user!.id);

  if (!deleted) {
    res.status(404).json({ message: "Complaint not found or not authorized" });
    return;
  }
  res.json({ message: "Complaint deleted" });
};
