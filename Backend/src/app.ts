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

// Checkout page — used as the Paypack checkout URL
app.get("/payment", (req: Request, res: Response) => {
  const { ref, amount, month, phone } = req.query as Record<string, string>;
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment - Waste Collection</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f0fdf4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
    .card{background:#fff;border-radius:1rem;padding:2rem;max-width:420px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    h1{font-size:1.25rem;font-weight:700;color:#14532d;margin-bottom:1.5rem;text-align:center}
    .row{display:flex;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid #f0fdf4;font-size:.95rem}
    .label{color:#6b7280}.value{font-weight:600;color:#111827}
    .badge{display:inline-block;padding:.25rem .75rem;border-radius:9999px;font-size:.8rem;font-weight:600}
    .pending{background:#fef9c3;color:#854d0e}
    .paid{background:#dcfce7;color:#166534}
    .failed{background:#fee2e2;color:#991b1b}
    .btn{display:block;width:100%;margin-top:1.5rem;padding:.85rem;background:#15803d;color:#fff;border:none;border-radius:.75rem;font-size:1rem;font-weight:600;cursor:pointer;text-align:center;text-decoration:none}
    .btn:hover{background:#166534}
    .footer{text-align:center;margin-top:1rem;font-size:.8rem;color:#9ca3af}
  </style>
</head>
<body>
  <div class="card">
    <h1>🧾 Payment Details</h1>
    ${ref ? `
    <div class="row"><span class="label">Reference</span><span class="value" style="font-size:.85rem;font-family:monospace">${ref}</span></div>
    ` : ""}
    ${month ? `<div class="row"><span class="label">Month</span><span class="value">${month}</span></div>` : ""}
    ${phone ? `<div class="row"><span class="label">Phone</span><span class="value">${phone}</span></div>` : ""}
    ${amount ? `<div class="row"><span class="label">Amount</span><span class="value">${Number(amount).toLocaleString()} RWF</span></div>` : ""}
    <div class="row"><span class="label">Status</span><span class="badge pending" id="status">Pending</span></div>
    <a href="/" class="btn">← Back to App</a>
    <p class="footer">Waste Collection Management System</p>
  </div>
  ${ref ? `<script>
    async function poll(){
      try{
        const r=await fetch('/api/paypack/status/${ref ? "'+encodeURIComponent(ref)+'" : ""}',{headers:{Authorization:'Bearer '+localStorage.getItem('auth_token')}});
        const d=await r.json();
        const el=document.getElementById('status');
        if(d.status==='Paid'){el.textContent='Paid ✓';el.className='badge paid';clearInterval(t)}
        else if(d.status==='Failed'){el.textContent='Failed';el.className='badge failed';clearInterval(t)}
      }catch(e){}
    }
    const t=setInterval(poll,4000);
    poll();
  </script>` : ""}
</body>
</html>`);
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
  const isDbDown = err.message?.includes("ENOTFOUND") ||
    err.message?.includes("Connection terminated") ||
    err.message?.includes("connection timeout") ||
    err.message?.includes("ECONNREFUSED");

  if (isDbDown) {
    // Suppress stack trace for known DB-unavailable errors — resume Neon at console.neon.tech
    console.warn("[DB unavailable]", err.message);
  } else {
    console.error("[Global Error]", err.message, err.stack);
  }

  res.status(500).json({ message: isDbDown ? "Database temporarily unavailable. Please try again." : err.message || "Internal server error" });
});

export default app;