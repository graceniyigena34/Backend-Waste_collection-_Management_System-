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
exports.removeSchedule = exports.patchScheduleStatus = exports.createCollectionSchedule = exports.listAllSchedules = exports.getDriverSchedules = exports.getMySchedules = void 0;
const scheduleModel_1 = require("../models/scheduleModel");
const householdModel_1 = require("../models/householdModel");
const VALID_STATUSES = ["Scheduled", "Completed", "Missed", "Pending"];
// GET /api/schedules/me — citizen gets their schedules
const getMySchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const schedules = yield (0, scheduleModel_1.getSchedulesByUserId)(req.user.id);
    res.json(schedules);
});
exports.getMySchedules = getMySchedules;
// GET /api/schedules/driver — driver gets their assigned schedules
const getDriverSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const schedules = yield (0, scheduleModel_1.getSchedulesByDriverId)(req.user.id);
    res.json(schedules);
});
exports.getDriverSchedules = getDriverSchedules;
// GET /api/schedules — Admin: get all schedules
const listAllSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const schedules = yield (0, scheduleModel_1.getAllSchedules)();
    res.json(schedules);
});
exports.listAllSchedules = listAllSchedules;
// POST /api/schedules — Admin creates a schedule for a household
const createCollectionSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, collection_date, collection_time, waste_type, location, driver_id, notes } = req.body;
    if (!user_id || !collection_date || !location) {
        res.status(400).json({ message: "user_id, collection_date and location are required" });
        return;
    }
    const household = yield (0, householdModel_1.getHouseholdByUserId)(Number(user_id));
    if (!household) {
        res.status(404).json({ message: "Household not found for this user" });
        return;
    }
    const schedule = yield (0, scheduleModel_1.createSchedule)({
        household_id: household.id,
        user_id: Number(user_id),
        collection_date,
        collection_time: collection_time || "08:00 AM",
        waste_type: waste_type || "General Waste",
        status: "Scheduled",
        location,
        driver_id: driver_id ? Number(driver_id) : undefined,
        notes,
    });
    res.status(201).json({ message: "Schedule created", schedule });
});
exports.createCollectionSchedule = createCollectionSchedule;
// PATCH /api/schedules/:id/status — Admin or Driver updates schedule status
const patchScheduleStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
        return;
    }
    const updated = yield (0, scheduleModel_1.updateScheduleStatus)(id, status);
    if (!updated) {
        res.status(404).json({ message: "Schedule not found" });
        return;
    }
    res.json({ message: "Schedule status updated", schedule: updated });
});
exports.patchScheduleStatus = patchScheduleStatus;
// DELETE /api/schedules/:id — Admin deletes a schedule
const removeSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield (0, scheduleModel_1.deleteSchedule)(Number(req.params.id));
    if (!deleted) {
        res.status(404).json({ message: "Schedule not found" });
        return;
    }
    res.json({ message: "Schedule deleted" });
});
exports.removeSchedule = removeSchedule;
