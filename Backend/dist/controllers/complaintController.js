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
exports.removeComplaint = exports.patchComplaintStatus = exports.listAllComplaints = exports.getMyComplaints = exports.submitComplaint = void 0;
const complaintModel_1 = require("../models/complaintModel");
const householdModel_1 = require("../models/householdModel");
const VALID_STATUSES = ["Pending", "In Progress", "Resolved"];
const VALID_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
// POST /api/complaints — citizen submits a complaint
const submitComplaint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_id = req.user.id;
    const { issue_type, description, priority } = req.body;
    if (!issue_type || !(description === null || description === void 0 ? void 0 : description.trim())) {
        res.status(400).json({ message: "issue_type and description are required" });
        return;
    }
    const household = yield (0, householdModel_1.getHouseholdByUserId)(user_id);
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : "Medium";
    const complaint = yield (0, complaintModel_1.createComplaint)({
        user_id,
        household_id: household === null || household === void 0 ? void 0 : household.id,
        issue_type,
        title: issue_type,
        description: description.trim(),
        priority: safePriority,
    });
    res.status(201).json({ message: "Complaint submitted successfully", complaint });
});
exports.submitComplaint = submitComplaint;
// GET /api/complaints/me — citizen gets their complaints
const getMyComplaints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const complaints = yield (0, complaintModel_1.getComplaintsByUserId)(req.user.id);
    res.json(complaints);
});
exports.getMyComplaints = getMyComplaints;
// GET /api/complaints — Admin: get all complaints
const listAllComplaints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const complaints = yield (0, complaintModel_1.getAllComplaints)();
    res.json(complaints);
});
exports.listAllComplaints = listAllComplaints;
// PATCH /api/complaints/:id/status — Admin updates complaint status
const patchComplaintStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const { status, assigned_to, resolution_note } = req.body;
    if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
        return;
    }
    const updated = yield (0, complaintModel_1.updateComplaintStatus)(id, status, assigned_to, resolution_note);
    if (!updated) {
        res.status(404).json({ message: "Complaint not found" });
        return;
    }
    res.json({ message: "Complaint updated", complaint: updated });
});
exports.patchComplaintStatus = patchComplaintStatus;
// DELETE /api/complaints/:id — Admin deletes a complaint
const removeComplaint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield (0, complaintModel_1.deleteComplaint)(Number(req.params.id));
    if (!deleted) {
        res.status(404).json({ message: "Complaint not found" });
        return;
    }
    res.json({ message: "Complaint deleted" });
});
exports.removeComplaint = removeComplaint;
