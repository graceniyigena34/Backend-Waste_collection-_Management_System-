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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.updateUserById = exports.listUsers = exports.deleteAccount = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("../models/userModel");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET)
    throw new Error("JWT_SECRET environment variable is not set");
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d");
const VALID_ROLES = ["citizen", "waste_collector", "admin"];
const sanitizeString = (value) => typeof value === "string" ? value.trim() : "";
const normalizeRole = (value) => {
    const role = sanitizeString(value).toLowerCase().replace(/[-\s]+/g, "_");
    if (role === "citizen" || role === "admin" || role === "waste_collector") {
        return role;
    }
    return null;
};
// ─── Auth ────────────────────────────────────────────────────────────────────
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            message: "Invalid role. Allowed roles: admin, citizen, waste_collector (or waste collector).",
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
    const existing = yield (0, userModel_1.findUserByEmail)(email);
    if (existing) {
        res.status(409).json({ message: "Email already registered" });
        return;
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    const user = yield (0, userModel_1.createUser)(full_name, email, telephone, safeRole, hashedPassword);
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({
        message: "Account created successfully",
        token,
        user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = sanitizeString(req.body.email).toLowerCase();
    const password = sanitizeString(req.body.password);
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }
    const user = yield (0, userModel_1.findUserByEmail)(email);
    if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({
        message: "Login successful",
        token,
        user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
});
exports.login = login;
// ─── CRUD ────────────────────────────────────────────────────────────────────
// READ — own profile
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, userModel_1.findUserById)(req.user.id);
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    const { password } = user, safeUser = __rest(user, ["password"]);
    res.json(safeUser);
});
exports.getProfile = getProfile;
// UPDATE — own profile
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fields = {};
    if (req.body.full_name)
        fields.full_name = sanitizeString(req.body.full_name);
    if (req.body.telephone)
        fields.telephone = sanitizeString(req.body.telephone);
    if (req.body.email)
        fields.email = sanitizeString(req.body.email).toLowerCase();
    if (req.body.password) {
        if (sanitizeString(req.body.password).length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters" });
            return;
        }
        fields.password = yield bcryptjs_1.default.hash(sanitizeString(req.body.password), 10);
    }
    const updated = yield (0, userModel_1.updateUser)(req.user.id, fields);
    if (!updated) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    const { password } = updated, safeUser = __rest(updated, ["password"]);
    res.json({ message: "Profile updated", user: safeUser });
});
exports.updateProfile = updateProfile;
// DELETE — own account
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield (0, userModel_1.deleteUser)(req.user.id);
    if (!deleted) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.json({ message: "Account deleted successfully" });
});
exports.deleteAccount = deleteAccount;
// READ ALL — Admin only
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield (0, userModel_1.getAllUsers)();
    res.json(users);
});
exports.listUsers = listUsers;
// UPDATE any user — Admin only
const updateUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const fields = {};
    if (req.body.full_name)
        fields.full_name = sanitizeString(req.body.full_name);
    if (req.body.telephone)
        fields.telephone = sanitizeString(req.body.telephone);
    if (req.body.email)
        fields.email = sanitizeString(req.body.email).toLowerCase();
    if (req.body.role && VALID_ROLES.includes(req.body.role))
        fields.role = req.body.role;
    const updated = yield (0, userModel_1.updateUser)(id, fields);
    if (!updated) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    const { password } = updated, safeUser = __rest(updated, ["password"]);
    res.json({ message: "User updated", user: safeUser });
});
exports.updateUserById = updateUserById;
// DELETE any user — Admin only
const deleteUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield (0, userModel_1.deleteUser)(Number(req.params.id));
    if (!deleted) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.json({ message: "User deleted successfully" });
});
exports.deleteUserById = deleteUserById;
