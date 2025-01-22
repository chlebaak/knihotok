const { Pool } = require("pg");
require("dotenv").config();

console.log("JWT_SECRET:", process.env.JWT_SECRET); // Výpis
console.log("DATABASE_URL:", process.env.DATABASE_URL); // Výpis hodnoty DATABASE_UR

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
