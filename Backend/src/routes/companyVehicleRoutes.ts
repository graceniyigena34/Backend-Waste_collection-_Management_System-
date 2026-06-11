import { Router } from "express";
import { authenticate, authorizeDriver } from "../middleware/auth";
import { listVehicles, addVehicle, editVehicle, removeVehicle } from "../controllers/companyVehicleController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Company vehicle management
 */

/**
 * @swagger
 * /api/vehicles/company/{companyId}:
 *   get:
 *     summary: List all vehicles for a company
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CompanyVehicle'
 */
router.get("/company/:companyId", authenticate, authorizeDriver, listVehicles);

/**
 * @swagger
 * /api/vehicles/company/{companyId}:
 *   post:
 *     summary: Add a vehicle to a company
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plate_number, model]
 *             properties:
 *               plate_number:
 *                 type: string
 *                 example: RAB 123 A
 *               model:
 *                 type: string
 *                 example: Isuzu NPR
 *               year:
 *                 type: string
 *                 example: "2020"
 *               capacity:
 *                 type: string
 *                 example: "5 tons"
 *               assigned_zone:
 *                 type: string
 *                 example: Kicukiro
 *               insurance_number:
 *                 type: string
 *                 example: INS-2024-001
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       201:
 *         description: Vehicle added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 vehicle:
 *                   $ref: '#/components/schemas/CompanyVehicle'
 */
router.post("/company/:companyId", authenticate, authorizeDriver, addVehicle);

/**
 * @swagger
 * /api/vehicles/company/{companyId}/{vehicleId}:
 *   put:
 *     summary: Update a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyVehicle'
 *     responses:
 *       200:
 *         description: Vehicle updated
 *       404:
 *         description: Vehicle not found
 */
router.put("/company/:companyId/:vehicleId", authenticate, authorizeDriver, editVehicle);

/**
 * @swagger
 * /api/vehicles/company/{companyId}/{vehicleId}:
 *   delete:
 *     summary: Delete a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle removed
 *       404:
 *         description: Vehicle not found
 */
router.delete("/company/:companyId/:vehicleId", authenticate, authorizeDriver, removeVehicle);

export default router;
