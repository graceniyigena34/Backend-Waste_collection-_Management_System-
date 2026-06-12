import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createPickupRequest,
  getPickupRequestsByUser,
  getAllPickupRequests,
  updatePickupRequestStatus,
  deletePickupRequest,
  deletePickupRequestAdmin,
  PickupStatus,
  PickupPriority,
} from "../models/pickupRequestModel";
import { createNotification } from "../models/notificationModel";
import { getCompanyUserIdByDistrict } from "../models/wasteCollectorModel";
import { getHouseholdByUserId } from "../models/householdModel";

const VALID_STATUSES: PickupStatus[]   = ["Pending", "In Progress", "Resolved", "Cancelled"];
const VALID_PRIORITIES: PickupPriority[] = ["Low", "Medium", "High", "Urgent"];

const isCompany = (role: string) => role === "waste_collector" || role === "admin";

// POST /api/pickup-requests — citizen submits a pickup request
export const submitPickupRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { preferred_date, preferred_time, notes, priority } = req.body;

  if (!preferred_date) {
    res.status(400).json({ message: "preferred_date is required" });
    return;
  }

  const safePriority: PickupPriority = VALID_PRIORITIES.includes(priority) ? priority : "Medium";

  const request = await createPickupRequest({
    user_id: userId,
    preferred_date,
    preferred_time: preferred_time ?? null,
    notes: notes ?? null,
    priority: safePriority,
  });

  // Notify the company that serves the citizen's district (fire-and-forget)
  getHouseholdByUserId(userId)
    .then(async (household) => {
      if (!household?.district) return;
      const companyUserId = await getCompanyUserIdByDistrict(household.district);
      if (!companyUserId) return;
      const dateLabel = new Date(preferred_date).toLocaleDateString("en-RW", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      await createNotification({
        user_id: companyUserId,
        title: "New Pickup Request",
        message: `A citizen in ${household.district} has requested a pickup on ${dateLabel}${preferred_time ? ` at ${preferred_time}` : ""}.${notes ? ` Note: ${notes}` : ""} Priority: ${safePriority}.`,
        type: "info",
      });
    })
    .catch(() => {});

  res.status(201).json({ message: "Pickup request submitted", request });
};

// GET /api/pickup-requests/me — citizen gets their own requests
export const getMyPickupRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const requests = await getPickupRequestsByUser(req.user!.id);
  res.json({ requests });
};

// GET /api/pickup-requests — admin or company gets all requests with citizen info
export const listAllPickupRequests = async (_req: AuthRequest, res: Response): Promise<void> => {
  const requests = await getAllPickupRequests();
  res.json({ requests });
};

// PATCH /api/pickup-requests/:id/status — company/admin updates status
export const patchPickupStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { status, assigned_driver, resolution_note } = req.body;

  if (!id || isNaN(id)) {
    res.status(400).json({ message: "Invalid request id" });
    return;
  }

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  const updated = await updatePickupRequestStatus(id, status, assigned_driver, resolution_note);
  if (!updated) {
    res.status(404).json({ message: "Pickup request not found" });
    return;
  }

  // Notify the citizen when status changes
  createNotification({
    user_id: updated.user_id,
    title: "Pickup Request Updated",
    message: status === "Resolved"
      ? `Your pickup request has been completed.${resolution_note ? ` Note: ${resolution_note}` : ""}`
      : status === "In Progress"
      ? `Your pickup request is now in progress.${assigned_driver ? ` Driver: ${assigned_driver}` : ""}`
      : `Your pickup request status changed to: ${status}.`,
    type: status === "Resolved" ? "success" : "info",
  }).catch(() => {});

  res.json({ message: "Pickup request updated", request: updated });
};

// DELETE /api/pickup-requests/:id — citizen cancels their own pending request
export const cancelPickupRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const userId = req.user!.id;
  const role = req.user!.role;

  if (!id || isNaN(id)) {
    res.status(400).json({ message: "Invalid request id" });
    return;
  }

  const deleted = isCompany(role)
    ? await deletePickupRequestAdmin(id)
    : await deletePickupRequest(id, userId);

  if (!deleted) {
    res.status(404).json({ message: "Request not found, already processed, or not yours" });
    return;
  }

  res.json({ message: "Pickup request cancelled" });
};
