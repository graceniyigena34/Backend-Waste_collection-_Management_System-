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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
// Routes
const authroutes_1 = __importDefault(require("./routes/authroutes"));
const householdRoutes_1 = __importDefault(require("./routes/householdRoutes"));
const scheduleRoutes_1 = __importDefault(require("./routes/scheduleRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const complaintRoutes_1 = __importDefault(require("./routes/complaintRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const wasteCollectorRoutes_1 = __importDefault(require("./routes/wasteCollectorRoutes"));
// Table initializers
const userModel_1 = require("./models/userModel");
const householdModel_1 = require("./models/householdModel");
const scheduleModel_1 = require("./models/scheduleModel");
const paymentModel_1 = require("./models/paymentModel");
const complaintModel_1 = require("./models/complaintModel");
const notificationModel_1 = require("./models/notificationModel");
const wasteCollectorModel_1 = require("./models/wasteCollectorModel");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Swagger docs
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// API routes
app.use("/api/auth", authroutes_1.default);
app.use("/api/households", householdRoutes_1.default);
app.use("/api/schedules", scheduleRoutes_1.default);
app.use("/api/payments", paymentRoutes_1.default);
app.use("/api/complaints", complaintRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/waste-collectors", wasteCollectorRoutes_1.default);
// Initialize all tables in order (respects foreign key dependencies)
const initDB = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, userModel_1.initUsersTable)();
    yield (0, householdModel_1.initHouseholdsTable)();
    yield (0, scheduleModel_1.initSchedulesTable)();
    yield (0, paymentModel_1.initPaymentsTable)();
    yield (0, complaintModel_1.initComplaintsTable)();
    yield (0, notificationModel_1.initNotificationsTable)();
    yield (0, wasteCollectorModel_1.initWasteCompaniesTable)();
    yield (0, wasteCollectorModel_1.initWasteCollectorTables)();
    console.log("✅ All database tables initialized");
});
initDB().catch(console.error);
exports.default = app;
