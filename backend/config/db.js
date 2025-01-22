const { Pool } = require("pg");
require("dotenv").config();

console.log("JWT_SECRET:", process.env.JWT_SECRET); 
console.log("DATABASE_URL:", process.env.DATABASE_URL); 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
