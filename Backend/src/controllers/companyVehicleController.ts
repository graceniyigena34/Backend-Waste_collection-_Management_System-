import { Request, Response } from "express";
import {
  getVehiclesByCompanyId,
  createCompanyVehicle,
  updateCompanyVehicle,
  deleteCompanyVehicle,
} from "../models/companyVehicleModel";

export const listVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    if (isNaN(companyId)) { res.status(400).json({ error: "Invalid company ID" }); return; }
    const vehicles = await getVehiclesByCompanyId(companyId);
    res.json({ vehicles });
  } catch (err) {
    console.error("listVehicles error:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};

export const addVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    if (isNaN(companyId)) { res.status(400).json({ error: "Invalid company ID" }); return; }
    const { plate_number, model, year, capacity, assigned_zone, insurance_number, status } = req.body;
    if (!plate_number || !model) { res.status(400).json({ error: "plate_number and model are required" }); return; }
    const vehicle = await createCompanyVehicle(companyId, {
      plate_number, model, year, capacity, assigned_zone, insurance_number, status,
    });
    res.status(201).json({ message: "Vehicle added successfully", vehicle });
  } catch (err) {
    console.error("addVehicle error:", err);
    res.status(500).json({ error: "Failed to add vehicle" });
  }
};

export const editVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    const vehicleId = parseInt(String(req.params.vehicleId), 10);
    if (isNaN(companyId) || isNaN(vehicleId)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { plate_number, model, year, capacity, assigned_zone, insurance_number, status } = req.body;
    const vehicle = await updateCompanyVehicle(companyId, vehicleId, {
      plate_number, model, year, capacity, assigned_zone, insurance_number, status,
    });
    if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
    res.json({ message: "Vehicle updated successfully", vehicle });
  } catch (err) {
    console.error("editVehicle error:", err);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
};

export const removeVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    const vehicleId = parseInt(String(req.params.vehicleId), 10);
    if (isNaN(companyId) || isNaN(vehicleId)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const deleted = await deleteCompanyVehicle(companyId, vehicleId);
    if (!deleted) { res.status(404).json({ error: "Vehicle not found" }); return; }
    res.json({ message: "Vehicle removed successfully" });
  } catch (err) {
    console.error("removeVehicle error:", err);
    res.status(500).json({ error: "Failed to remove vehicle" });
  }
};
