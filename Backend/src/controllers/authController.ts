import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  deleteUser,
  getAllUsers,
  UserRole,
} from "../models/userModel";
import { AuthRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d") as jwt.SignOptions["expiresIn"];
const VALID_ROLES: UserRole[] = ["citizen", "waste_collector", "admin"];

const sanitizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeRole = (value: unknown): UserRole | null => {
  const role = sanitizeString(value).toLowerCase().replace(/[-\s]+/g, "_");

  if (role === "citizen" || role === "admin" || role === "waste_collector") {
    return role;
  }

  return null;
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const full_name = sanitizeString(req.body.full_name);
  const email = sanitizeString(req.body.email).toLowerCase();
  const telephone = sanitizeString(req.body.telephone);
  const password = sanitizeString(req.body.password);
  const confirm_password = sanitizeString(req.body.confirm_password);
  const safeRole = normalizeRole(req.body.role);

  if (!full_name || !email || !telephone || !password || !confirm_password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }
  if (!safeRole || !VALID_ROLES.includes(safeRole)) {
    res.status(400).json({
      message:
        "Invalid role. Allowed roles: admin, citizen, waste_collector (or waste collector).",
    });
    return;
  }
  if (password !== confirm_password) {
    res.status(400).json({ message: "Passwords do not match" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser(full_name, email, telephone, safeRole, hashedPassword);
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.status(201).json({
    message: "Account created successfully",
    token,
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
  });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const email = sanitizeString(req.body.email).toLowerCase();
  const password = sanitizeString(req.body.password);

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({
    message: "Login successful",
    token,
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
  });
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

// READ — own profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const { password, ...safeUser } = user;
  res.json(safeUser);
};

// UPDATE — own profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const fields: Record<string, string | UserRole> = {};

  if (req.body.full_name) fields.full_name = sanitizeString(req.body.full_name);
  if (req.body.telephone) fields.telephone = sanitizeString(req.body.telephone);
  if (req.body.email) fields.email = sanitizeString(req.body.email).toLowerCase();

  if (req.body.password) {
    if (sanitizeString(req.body.password).length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }
    fields.password = await bcrypt.hash(sanitizeString(req.body.password), 10);
  }

  const updated = await updateUser(req.user!.id, fields);
  if (!updated) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const { password, ...safeUser } = updated;
  res.json({ message: "Profile updated", user: safeUser });
};

// DELETE — own account
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const deleted = await deleteUser(req.user!.id);
  if (!deleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ message: "Account deleted successfully" });
};

// READ ALL — Admin only
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await getAllUsers();
  res.json(users);
};

// UPDATE any user — Admin only
export const updateUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const fields: Record<string, string | UserRole> = {};

  if (req.body.full_name) fields.full_name = sanitizeString(req.body.full_name);
  if (req.body.telephone) fields.telephone = sanitizeString(req.body.telephone);
  if (req.body.email) fields.email = sanitizeString(req.body.email).toLowerCase();
  if (req.body.role && VALID_ROLES.includes(req.body.role)) fields.role = req.body.role;

  const updated = await updateUser(id, fields);
  if (!updated) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const { password, ...safeUser } = updated;
  res.json({ message: "User updated", user: safeUser });
};

// DELETE any user — Admin only
export const deleteUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const deleted = await deleteUser(Number(req.params.id));
  if (!deleted) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ message: "User deleted successfully" });
};
