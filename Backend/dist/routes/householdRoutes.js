"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const householdController_1 = require("../controllers/householdController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/households:
 *   post:
 *     summary: Submit household details (Citizen — after signup)
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [district, sector, cell, village, street_address]
 *             properties:
 *               district: { type: string, example: Kicukiro }
 *               sector: { type: string, example: Kicukiro }
 *               cell: { type: string, example: Gasharu }
 *               village: { type: string, example: Gasharu }
 *               street_address: { type: string, example: "KG 12 St, House No. 5" }
 *               house_type: { type: string, enum: [RESIDENTIAL, APARTMENT, COMMERCIAL, VILLA], default: RESIDENTIAL }
 *               residents: { type: integer, default: 1 }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Household registered
 *       409:
 *         description: Household already registered
 */
router.post("/", auth_1.authenticate, householdController_1.submitHousehold);
/**
 * @swagger
 * /api/households/me:
 *   get:
 *     summary: Get own household details (Citizen)
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Household details
 *       404:
 *         description: Household not found
 */
router.get("/me", auth_1.authenticate, householdController_1.getMyHousehold);
/**
 * @swagger
 * /api/households/me:
 *   put:
 *     summary: Update own household details (Citizen)
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               district: { type: string }
 *               sector: { type: string }
 *               cell: { type: string }
 *               village: { type: string }
 *               street_address: { type: string }
 *               house_type: { type: string }
 *               residents: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Household updated
 */
router.put("/me", auth_1.authenticate, householdController_1.updateMyHousehold);
/**
 * @swagger
 * /api/households:
 *   get:
 *     summary: Get all households (Admin only)
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all households
 */
router.get("/", auth_1.authenticate, auth_1.authorizeAdmin, householdController_1.listAllHouseholds);
exports.default = router;
