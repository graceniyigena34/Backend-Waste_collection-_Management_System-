import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// Routes
import authRoutes from "./routes/authRoutes";
import householdRoutes from "./routes/householdRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";
import companyScheduleRoutes from "./routes/companyScheduleRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import notificationRoutes from "./routes/notificationRoutes";

import companyProfileRoutes from "./routes/companyProfileRoutes";
import paypackRoutes from "./routes/paypackRoutes";
import companyDriverRoutes from "./routes/companyDriverRoutes";
import companyVehicleRoutes from "./routes/companyVehicleRoutes";
import chatRoutes from "./routes/chatRoutes";

// Table initializers
import { initUsersTable } from "./models/userModel";
import { initHouseholdsTable } from "./models/householdModel";
import { initSchedulesTable } from "./models/scheduleModel";
import { initPaymentsTable, initPaypackLogsTable } from "./models/paymentModel";
import { initComplaintsTable } from "./models/complaintModel";
import { initNotificationsTable } from "./models/notificationModel";
import { initWasteCompaniesTable, initWasteCollectorTables } from "./models/wasteCollectorModel";
import { initCompanySchedulesTable } from "./models/companyScheduleModel";
import { initChatTable } from "./models/chatModel";
import { initCompanyDriversTable } from "./models/companyDriverModel";
import { initCompanyVehiclesTable } from "./models/companyVehicleModel";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

// Health check for deployment platforms and uptime monitoring
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

// Root route: provide basic info and links for browsers visiting '/'
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Waste Collection Management Backend",
    docs: "/api-docs",
    health: "/api/health",
  });
});
// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/company-schedules", companyScheduleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api/companies", companyProfileRoutes);
app.use("/api/paypack", paypackRoutes);
app.use("/api/drivers", companyDriverRoutes);
app.use("/api/vehicles", companyVehicleRoutes);
app.use("/api/chat", chatRoutes);

// Initialize all tables in order (respects foreign key dependencies)
const initDB = async () => {
  await initUsersTable();
  await initHouseholdsTable();
  await initSchedulesTable();
  await initPaymentsTable();
  await initComplaintsTable();
  await initNotificationsTable();
  await initWasteCompaniesTable();
  await initWasteCollectorTables();
  await initCompanyDriversTable();
  await initCompanyVehiclesTable();
  await initPaypackLogsTable();
  console.log("✅ All database tables initialized");
};

initDB().catch(console.error);

// Global error handler — must be registered after all routes
// Returns a JSON error body instead of an HTML page so the frontend can display it
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Global Error]", err.message, err.stack);
  res.status(500).json({ message: err.message || "Internal server error" });
});

export default app;