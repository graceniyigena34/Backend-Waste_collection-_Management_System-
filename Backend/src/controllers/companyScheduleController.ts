import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createCompanySchedule,
  deleteCompanySchedule,
  getCompanyScheduleById,
  getCompanySchedules,
  getCompanySchedulesByDate,
  getSchedulesByDistrictAndSector,
  setSchedulePublished,
  updateCompanySchedule,
} from "../models/companyScheduleModel";
import { getHouseholdByUserId } from "../models/householdModel";
import { getCompanyProfileById } from "../models/wasteCollectorModel";

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const listCompanySchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  if (!companyId) {
    res.status(400).json({ message: "companyId must be a valid number" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const schedules = await getCompanySchedules(companyId);
  res.json({ schedules });
};

export const listCompanySchedulesByDate = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const scheduleDate = String(req.params.scheduleDate || "").trim();

  if (!companyId || !scheduleDate) {
    res.status(400).json({ message: "companyId and scheduleDate are required" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const schedules = await getCompanySchedulesByDate(companyId, scheduleDate);
  res.json({ schedules });
};

export const createCompanyScheduleEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  if (!companyId) {
    res.status(400).json({ message: "companyId must be a valid number" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const { district_id, district_name, schedule_date, day, sector_id, sector_name, cells, driver, vehicle, start_time, waste_type, status, notes } = req.body;

  if (!schedule_date || !day || !Array.isArray(cells) || cells.length === 0) {
    res.status(400).json({ message: "schedule_date, day and cells are required" });
    return;
  }

  const schedule = await createCompanySchedule({
    company_id: companyId,
    district_id,
    district_name,
    schedule_date,
    day,
    sector_id,
    sector_name,
    cells,
    driver,
    vehicle,
    start_time,
    waste_type: waste_type || "General Waste",
    status: status || "Scheduled",
    published: false,
    notes,
  });

  res.status(201).json({ message: "Company schedule created", schedule });
};

export const updateCompanyScheduleEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const scheduleId = toNumber(req.params.scheduleId);

  if (!companyId || !scheduleId) {
    res.status(400).json({ message: "companyId and scheduleId must be valid numbers" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const existing = await getCompanyScheduleById(companyId, scheduleId);
  if (!existing) {
    res.status(404).json({ message: "Company schedule not found" });
    return;
  }

  const updated = await updateCompanySchedule(companyId, scheduleId, req.body);
  res.json({ message: "Company schedule updated", schedule: updated });
};

export const toggleSchedulePublished = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const scheduleId = toNumber(req.params.scheduleId);

  if (!companyId || !scheduleId) {
    res.status(400).json({ message: "companyId and scheduleId must be valid numbers" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const published: boolean = Boolean(req.body.published);
  const schedule = await setSchedulePublished(companyId, scheduleId, published);
  if (!schedule) {
    res.status(404).json({ message: "Schedule not found" });
    return;
  }

  res.json({ message: published ? "Schedule published" : "Schedule unpublished", schedule });
};

export const listSchedulesForCitizen = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const household = await getHouseholdByUserId(userId);
  if (!household) {
    res.status(404).json({ message: "No household found for your account. Please complete your household setup first." });
    return;
  }

  const schedules = await getSchedulesByDistrictAndSector(household.district, household.sector);
  res.json({ schedules, district: household.district, sector: household.sector });
};

export const removeCompanyScheduleEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = toNumber(req.params.companyId);
  const scheduleId = toNumber(req.params.scheduleId);

  if (!companyId || !scheduleId) {
    res.status(400).json({ message: "companyId and scheduleId must be valid numbers" });
    return;
  }

  const company = await getCompanyProfileById(companyId);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }

  const deleted = await deleteCompanySchedule(companyId, scheduleId);
  if (!deleted) {
    res.status(404).json({ message: "Company schedule not found" });
    return;
  }

  res.json({ message: "Company schedule deleted" });
};