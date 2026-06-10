import { Request, Response } from "express";
import {
  getVehiclesByCompanyId,
  createCompanyVehicle,
  deleteCompanyVehicle,
} from "../models/companyVehicleModel";

export const listVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    if (isNaN(companyId)) {
      res.status(400).json({ error: "Invalid company ID" });
      return;
    }
    const vehicles = await getVehiclesByCompanyId(companyId);
    res.json(vehicles);
  } catch (err) {
    console.error("listVehicles error:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};

export const addVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    if (isNaN(companyId)) {
      res.status(400).json({ error: "Invalid company ID" });
      return;
    }
    const { plate_number, model, year, capacity, insurance_number } = req.body;
    if (!plate_number || !model) {
      res.status(400).json({ error: "plate_number and model are required" });
      return;
    }
    const vehicle = await createCompanyVehicle(companyId, {
      plate_number,
      model,
      year: year ? parseInt(year, 10) : undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      insurance_number,
    });
    res.status(201).json(vehicle);
  } catch (err) {
    console.error("addVehicle error:", err);
    res.status(500).json({ error: "Failed to add vehicle" });
  }
};

export const removeVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = parseInt(String(req.params.companyId), 10);
    const vehicleId = parseInt(String(req.params.vehicleId), 10);
    if (isNaN(companyId) || isNaN(vehicleId)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const deleted = await deleteCompanyVehicle(companyId, vehicleId);
    if (!deleted) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    res.json({ message: "Vehicle removed" });
  } catch (err) {
    console.error("removeVehicle error:", err);
    res.status(500).json({ error: "Failed to remove vehicle" });
  }
};
