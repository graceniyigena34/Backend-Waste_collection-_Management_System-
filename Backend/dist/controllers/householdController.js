"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllHouseholds = exports.updateMyHousehold = exports.getMyHousehold = exports.submitHousehold = void 0;
const householdModel_1 = require("../models/householdModel");
const VALID_HOUSE_TYPES = ["RESIDENTIAL", "APARTMENT", "COMMERCIAL", "VILLA"];
// POST /api/households — citizen submits their location after signup
const submitHousehold = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_id = req.user.id;
    const { district, sector, cell, village, street_address, house_type, residents, notes } = req.body;
    if (!district || !sector || !cell || !village || !street_address) {
        res.status(400).json({ message: "district, sector, cell, village and street_address are required" });
        return;
    }
    const existing = yield (0, householdModel_1.getHouseholdByUserId)(user_id);
    if (existing) {
        res.status(409).json({ message: "Household already registered. Use PUT to update." });
        return;
    }
    const safeHouseType = VALID_HOUSE_TYPES.includes(house_type) ? house_type : "RESIDENTIAL";
    const zone = district; // assign zone based on district
    const household = yield (0, householdModel_1.createHousehold)(user_id, {
        district, sector, cell, village,
        street_address,
        house_type: safeHouseType,
        residents: Number(residents) || 1,
        notes: notes || null,
        zone,
    });
    res.status(201).json({ message: "Household registered successfully", household });
});
exports.submitHousehold = submitHousehold;
// GET /api/households/me — citizen gets their own household
const getMyHousehold = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const household = yield (0, householdModel_1.getHouseholdByUserId)(req.user.id);
    if (!household) {
        res.status(404).json({ message: "Household not found. Please complete your profile." });
        return;
    }
    res.json(household);
});
exports.getMyHousehold = getMyHousehold;
// PUT /api/households/me — citizen updates their household
const updateMyHousehold = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { district, sector, cell, village, street_address, house_type, residents, notes } = req.body;
    const fields = {};
    if (district)
        fields.district = district;
    if (sector)
        fields.sector = sector;
    if (cell)
        fields.cell = cell;
    if (village)
        fields.village = village;
    if (street_address)
        fields.street_address = street_address;
    if (house_type && VALID_HOUSE_TYPES.includes(house_type))
        fields.house_type = house_type;
    if (residents)
        fields.residents = Number(residents);
    if (notes !== undefined)
        fields.notes = notes;
    if (district)
        fields.zone = district;
    const updated = yield (0, householdModel_1.updateHousehold)(req.user.id, fields);
    if (!updated) {
        res.status(404).json({ message: "Household not found" });
        return;
    }
    res.json({ message: "Household updated", household: updated });
});
exports.updateMyHousehold = updateMyHousehold;
// GET /api/households — Admin: get all households
const listAllHouseholds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const households = yield (0, householdModel_1.getAllHouseholds)();
    res.json(households);
});
exports.listAllHouseholds = listAllHouseholds;
