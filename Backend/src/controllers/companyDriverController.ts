import { Request, Response } from "express";
import {
  getDriversByCompanyId,
  getAllDrivers,
  createCompanyDriver,
  deleteCompanyDriver,
  updateCompanyDriver,
} from "../models/companyDriverModel";

export const listDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    if (isNaN(companyId)) { res.status(400).json({ error: "Invalid company ID" }); return; }
    const drivers = await getDriversByCompanyId(companyId);
    res.json({ drivers });
  } catch (err) {
    console.error("listDrivers error:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
};

export const listAllDrivers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await getAllDrivers();
    res.json({ drivers });
  } catch (err) {
    console.error("listAllDrivers error:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
};

export const addDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    if (isNaN(companyId)) { res.status(400).json({ error: "Invalid company ID" }); return; }
    const { name, phone, email, license_number, national_id, years_of_experience, status, zone, truck_id } = req.body;
    if (!name || !phone) { res.status(400).json({ error: "name and phone are required" }); return; }
    const driver = await createCompanyDriver(companyId, {
      name, phone, email, license_number, national_id,
      years_of_experience: years_of_experience ? parseInt(String(years_of_experience), 10) : 0,
      status, zone, truck_id,
    });
    res.status(201).json({ message: "Driver added successfully", driver });
  } catch (err) {
    console.error("addDriver error:", err);
    res.status(500).json({ error: "Failed to add driver" });
  }
};

export const editDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    const driverId = parseInt(String(req.params.driverId), 10);
    if (isNaN(companyId) || isNaN(driverId)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { name, phone, email, license_number, national_id, years_of_experience, status, zone, truck_id } = req.body;
    const driver = await updateCompanyDriver(companyId, driverId, {
      name, phone, email, license_number, national_id,
      years_of_experience: years_of_experience ? parseInt(String(years_of_experience), 10) : undefined,
      status, zone, truck_id,
    });
    if (!driver) { res.status(404).json({ error: "Driver not found" }); return; }
    res.json({ message: "Driver updated successfully", driver });
  } catch (err) {
    console.error("editDriver error:", err);
    res.status(500).json({ error: "Failed to update driver" });
  }
};

export const removeDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    const driverId = parseInt(String(req.params.driverId), 10);
    if (isNaN(companyId) || isNaN(driverId)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const deleted = await deleteCompanyDriver(companyId, driverId);
    if (!deleted) { res.status(404).json({ error: "Driver not found" }); return; }
    res.json({ message: "Driver removed successfully" });
  } catch (err) {
    console.error("removeDriver error:", err);
    res.status(500).json({ error: "Failed to remove driver" });
  }
};
