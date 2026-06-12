import { Router } from "express";
import { authenticate, authorizeDriver } from "../middleware/auth";
import {
  listAssignments,
  addAssignment,
  editAssignment,
  removeAssignment,
} from "../controllers/assignmentController";

const router = Router();

// Company/Admin: list all assignments for a company
router.get("/company/:companyId", authenticate, authorizeDriver, listAssignments);

// Company/Admin: create a new assignment
router.post("/", authenticate, authorizeDriver, addAssignment);

// Company/Admin: update an assignment
router.patch("/:id", authenticate, authorizeDriver, editAssignment);

// Company/Admin: delete an assignment
router.delete("/:id", authenticate, authorizeDriver, removeAssignment);

export default router;
