import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import {
  createCompany,
  getCompany,
  getCompanyByEmail,
  getCompanyByTin,
  getAllCompanies,
  getCompaniesByStatus,
  updateCompany,
  deleteCompany,
  searchCompanies,
  filterCompanies,
  approveCompany,
  rejectCompany,
  suspendCompany,
  reactivateCompany,
} from "../controllers/companyProfileController";

const router = Router();

// ─── Create Company Profile ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create new company profile
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - email
 *               - phone
 *             properties:
 *               company_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               tin:
 *                 type: string
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               district:
 *                 type: string
 *               sector:
 *                 type: string
 *               cell:
 *                 type: string
 *               village:
 *                 type: string
 *               company_type:
 *                 type: string
 *               years_of_experience:
 *                 type: number
 *               number_of_employees:
 *                 type: number
 *               vehicles:
 *                 type: array
 *               certificates:
 *                 type: array
 *     responses:
 *       201:
 *         description: Company profile created successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email or TIN already registered
 */
router.post("/", authenticate, createCompany);

// ─── Get All Companies ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/all:
 *   get:
 *     summary: Get all company profiles with pagination
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *       - name: offset
 *         in: query
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of all company profiles
 */
router.get("/all", authenticate, getAllCompanies);

// ─── Get Company by ID ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company profile by ID
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Company profile details
 *       404:
 *         description: Company not found
 */
router.get("/:id", authenticate, getCompany);

// ─── Get Company by Email ───────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/email/{email}:
 *   get:
 *     summary: Get company profile by email
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: email
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company profile details
 *       404:
 *         description: Company not found
 */
router.get("/email/:email", authenticate, getCompanyByEmail);

// ─── Get Company by TIN ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/tin/{tin}:
 *   get:
 *     summary: Get company profile by TIN
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tin
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company profile details
 *       404:
 *         description: Company not found
 */
router.get("/tin/:tin", authenticate, getCompanyByTin);

// ─── Get Companies by Status ────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/status/{status}:
 *   get:
 *     summary: Get companies by approval status
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, suspended]
 *     responses:
 *       200:
 *         description: List of companies by status
 */
router.get("/status/:status", authenticate, getCompaniesByStatus);

// ─── Search Companies ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/search:
 *   get:
 *     summary: Search companies by name, email, district, or TIN
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", authenticate, searchCompanies);

// ─── Filter Companies ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/filter:
 *   get:
 *     summary: Filter companies by multiple criteria
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: is_active
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: company_type
 *         in: query
 *         schema:
 *           type: string
 *       - name: district
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered company list
 */
router.get("/filter", authenticate, filterCompanies);

// ─── Update Company Profile ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Update company profile
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Company profile updated successfully
 *       404:
 *         description: Company not found
 */
router.put("/:id", authenticate, updateCompany);

// ─── Delete Company Profile ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Delete company profile
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Company profile deleted successfully
 *       404:
 *         description: Company not found
 */
router.delete("/:id", authenticate, deleteCompany);

// ─── Admin Actions ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/companies/{id}/approve:
 *   put:
 *     summary: Approve company profile (Admin only)
 *     tags: [Company Profiles - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Company approved successfully
 *       403:
 *         description: Only admins can approve companies
 *       404:
 *         description: Company not found
 */
router.put("/:id/approve", authenticate, authorizeAdmin, approveCompany);

/**
 * @swagger
 * /api/companies/{id}/reject:
 *   put:
 *     summary: Reject company profile (Admin only)
 *     tags: [Company Profiles - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Company rejected successfully
 *       403:
 *         description: Only admins can reject companies
 *       404:
 *         description: Company not found
 */
router.put("/:id/reject", authenticate, authorizeAdmin, rejectCompany);

/**
 * @swagger
 * /api/companies/{id}/suspend:
 *   put:
 *     summary: Suspend company profile (Admin only)
 *     tags: [Company Profiles - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Company suspended successfully
 *       403:
 *         description: Only admins can suspend companies
 *       404:
 *         description: Company not found
 */
router.put("/:id/suspend", authenticate, authorizeAdmin, suspendCompany);

/**
 * @swagger
 * /api/companies/{id}/reactivate:
 *   put:
 *     summary: Reactivate company profile
 *     tags: [Company Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Company reactivated successfully
 *       404:
 *         description: Company not found
 */
router.put("/:id/reactivate", authenticate, reactivateCompany);

export default router;
