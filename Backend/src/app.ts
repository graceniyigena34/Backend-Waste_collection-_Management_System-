import express, { Application } from "express";
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

// Table initializers
import { initUsersTable } from "./models/userModel";
import { initHouseholdsTable } from "./models/householdModel";
import { initSchedulesTable } from "./models/scheduleModel";
import { initPaymentsTable } from "./models/paymentModel";
import { initComplaintsTable } from "./models/complaintModel";
import { initNotificationsTable } from "./models/notificationModel";
import { initWasteCompaniesTable, initWasteCollectorTables } from "./models/wasteCollectorModel";
import { initCompanySchedulesTable } from "./models/companyScheduleModel";

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
  await initCompanySchedulesTable();
  console.log("✅ All database tables initialized");
};

initDB().catch(console.error);

export default app;
