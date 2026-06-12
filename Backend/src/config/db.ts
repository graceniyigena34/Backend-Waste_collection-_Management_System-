import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const useSsl = process.env.DATABASE_SSL === "true" || process.env.PGSSLMODE === "require";

const sharedConfig = {
  // Drop idle connections before the server-side 60 s timeout to avoid ECONNABORTED
  idleTimeoutMillis: 30000,
  // Retry a failed connection up to 3 times before throwing
  connectionTimeoutMillis: 10000,
  keepAlive: true,
};

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      ...sharedConfig,
    }
  : {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ...sharedConfig,
    };

export const pool = new Pool(poolConfig);

// Swallow idle-connection errors so they don't crash ts-node-dev
pool.on("error", (err) => {
  console.error("[pg pool] idle client error:", err.message);
});

// Ping Neon every 4 minutes to prevent free-tier auto-pause (5-min timeout)
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
  } catch {
    // Ignore — pool will reconnect on next real request
  }
}, 4 * 60 * 1000);
