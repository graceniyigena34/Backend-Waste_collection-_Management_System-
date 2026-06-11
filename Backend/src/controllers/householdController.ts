import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createHousehold,
  getHouseholdByUserId,
  updateHousehold,
  getAllHouseholds,
  getHouseholdsByDistrict,
  HouseType,
} from "../models/householdModel";

const VALID_HOUSE_TYPES: HouseType[] = ["RESIDENTIAL", "APARTMENT", "COMMERCIAL", "VILLA"];

// POST /api/households — citizen submits their location after signup
export const submitHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  const user_id = req.user!.id;
  const { district, sector, cell, village, street_address, house_type, residents, notes } = req.body;

  if (!district || !sector || !cell || !village || !street_address) {
    res.status(400).json({ message: "district, sector, cell, village and street_address are required" });
    return;
  }

  const existing = await getHouseholdByUserId(user_id);
  if (existing) {
    res.status(409).json({ message: "Household already registered. Use PUT to update." });
    return;
  }

  const safeHouseType: HouseType = VALID_HOUSE_TYPES.includes(house_type) ? house_type : "RESIDENTIAL";
  const zone = district; // assign zone based on district

  const household = await createHousehold(user_id, {
    district, sector, cell, village,
    street_address,
    house_type: safeHouseType,
    residents: Number(residents) || 1,
    notes: notes || null,
    zone,
  });

  res.status(201).json({ message: "Household registered successfully", household });
};

// GET /api/households/me — citizen gets their own household
export const getMyHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  const household = await getHouseholdByUserId(req.user!.id);
  if (!household) {
    res.status(404).json({ message: "Household not found. Please complete your profile." });
    return;
  }
  res.json(household);
};

// PUT /api/households/me — citizen updates their household
export const updateMyHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  const { district, sector, cell, village, street_address, house_type, residents, notes } = req.body;
  const fields: Record<string, unknown> = {};

  if (district) fields.district = district;
  if (sector) fields.sector = sector;
  if (cell) fields.cell = cell;
  if (village) fields.village = village;
  if (street_address) fields.street_address = street_address;
  if (house_type && VALID_HOUSE_TYPES.includes(house_type)) fields.house_type = house_type;
  if (residents) fields.residents = Number(residents);
  if (notes !== undefined) fields.notes = notes;
  if (district) fields.zone = district;

  const updated = await updateHousehold(req.user!.id, fields as any);
  if (!updated) {
    res.status(404).json({ message: "Household not found" });
    return;
  }
  res.json({ message: "Household updated", household: updated });
};

// GET /api/households — Admin: get all households
export const listAllHouseholds = async (_req: AuthRequest, res: Response): Promise<void> => {
  const households = await getAllHouseholds();
  res.json(households);
};

// GET /api/households/district/:district — Waste collector: get citizens in their district
export const listHouseholdsByDistrict = async (req: AuthRequest, res: Response): Promise<void> => {
  const { district } = req.params;
  if (!district) {
    res.status(400).json({ message: "district param is required" });
    return;
  }
  const households = await getHouseholdsByDistrict(district);
  res.json({ district, count: households.length, households });
};
