import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createSchedule,
  getSchedulesByUserId,
  getSchedulesByDriverId,
  getAllSchedules,
  updateScheduleStatus,
  deleteSchedule,
  ScheduleStatus,
} from "../models/scheduleModel";
import { getHouseholdByUserId } from "../models/householdModel";

const VALID_STATUSES: ScheduleStatus[] = ["Scheduled", "Completed", "Missed", "Pending"];

// GET /api/schedules/me — citizen gets their schedules
export const getMySchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  const schedules = await getSchedulesByUserId(req.user!.id);
  res.json(schedules);
};

// GET /api/schedules/driver — driver gets their assigned schedules
export const getDriverSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  const schedules = await getSchedulesByDriverId(req.user!.id);
  res.json(schedules);
};

// GET /api/schedules — Admin: get all schedules
export const listAllSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  const schedules = await getAllSchedules();
  res.json(schedules);
};

// POST /api/schedules — Admin creates a schedule for a household
export const createCollectionSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  const { user_id, collection_date, collection_time, waste_type, location, driver_id, notes } = req.body;

  if (!user_id || !collection_date || !location) {
    res.status(400).json({ message: "user_id, collection_date and location are required" });
    return;
  }

  const household = await getHouseholdByUserId(Number(user_id));
  if (!household) {
    res.status(404).json({ message: "Household not found for this user" });
    return;
  }

  const schedule = await createSchedule({
    household_id: household.id,
    user_id: Number(user_id),
    collection_date,
    collection_time: collection_time || "08:00 AM",
    waste_type: waste_type || "General Waste",
    status: "Scheduled",
    location,
    driver_id: driver_id ? Number(driver_id) : undefined,
    notes,
  });

  res.status(201).json({ message: "Schedule created", schedule });
};

// PATCH /api/schedules/:id/status — Admin or Driver updates schedule status
export const patchScheduleStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  const updated = await updateScheduleStatus(id, status);
  if (!updated) {
    res.status(404).json({ message: "Schedule not found" });
    return;
  }
  res.json({ message: "Schedule status updated", schedule: updated });
};

// DELETE /api/schedules/:id — Admin deletes a schedule
export const removeSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  const deleted = await deleteSchedule(Number(req.params.id));
  if (!deleted) {
    res.status(404).json({ message: "Schedule not found" });
    return;
  }
  res.json({ message: "Schedule deleted" });
};
