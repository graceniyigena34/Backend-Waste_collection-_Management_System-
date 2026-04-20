import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// Routes
import authRoutes from "./routes/authroutes";
import householdRoutes from "./routes/householdRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import notificationRoutes from "./routes/notificationRoutes";

// Table initializers
import { initUsersTable } from "./models/usermodel";
import { initHouseholdsTable } from "./models/householdModel";
import { initSchedulesTable } from "./models/scheduleModel";
import { initPaymentsTable } from "./models/paymentModel";
import { initComplaintsTable } from "./models/complaintModel";
import { initNotificationsTable } from "./models/notificationModel";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);

// Initialize all tables in order (respects foreign key dependencies)
const initDB = async () => {
  await initUsersTable();
  await initHouseholdsTable();
  await initSchedulesTable();
  await initPaymentsTable();
  await initComplaintsTable();
  await initNotificationsTable();
  console.log("✅ All database tables initialized");
};

initDB().catch(console.error);

export default app;
