const { Pool } = require("pg");

// Reuse database connections across requests.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;