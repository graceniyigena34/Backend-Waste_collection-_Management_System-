import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
  listUsers,
  updateUserById,
  deleteUserById,
} from "../controllers/authcontroller";
import { authenticate, authorizeAdmin } from "../middleware/auth";

const router = Router();

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Email already registered
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to your account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

// ─── Profile (own account) ───────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get own profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", authenticate, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update own profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", authenticate, updateProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   delete:
 *     summary: Delete own account
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 */
router.delete("/profile", authenticate, deleteAccount);

// ─── Admin — manage all users ────────────────────────────────────────────────

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserProfile'
 *       403:
 *         description: Admin access required
 */
router.get("/users", authenticate, authorizeAdmin, listUsers);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   put:
 *     summary: Update any user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateRequest'
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.put("/users/:id", authenticate, authorizeAdmin, updateUserById);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Delete any user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", authenticate, authorizeAdmin, deleteUserById);

export default router;
