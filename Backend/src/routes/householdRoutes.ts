import { Router } from "express";
import { authenticate, authorizeAdmin, authorizeDriver } from "../middleware/auth";
import {
  submitHousehold,
  getMyHousehold,
  updateMyHousehold,
  listAllHouseholds,
  listHouseholdsByDistrict,
  adminUpdateHousehold,
  adminDeleteHousehold,
} from "../controllers/householdController";

const router = Router();

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
router.post("/", authenticate, submitHousehold);

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
router.get("/me", authenticate, getMyHousehold);

router.get("/district/:district", authenticate, authorizeDriver, listHouseholdsByDistrict);

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
router.put("/me", authenticate, updateMyHousehold);

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
router.get("/", authenticate, authorizeAdmin, listAllHouseholds);
router.patch("/:id", authenticate, authorizeAdmin, adminUpdateHousehold);
router.delete("/:id", authenticate, authorizeAdmin, adminDeleteHousehold);

export default router;
