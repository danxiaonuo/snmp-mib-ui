import { neon } from "@neondatabase/serverless"

// 支持本地PostgreSQL和Neon
const getDatabaseUrl = () => {
  // 优先使用Neon URL，如果没有则使用本地PostgreSQL
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "postgresql://netmon_user:netmon_password@localhost:5432/network_monitor"
  )
}

const sql = neon(getDatabaseUrl())

export { sql }

// PostgreSQL连接池配置（如果使用本地PostgreSQL）
export const dbConfig = {
  host: process.env.PGHOST || "localhost",
  port: Number.parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE || "network_monitor",
  user: process.env.PGUSER || "netmon_user",
  password: process.env.PGPASSWORD || "netmon_password",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
}
