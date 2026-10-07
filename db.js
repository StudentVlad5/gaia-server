const { Pool } = require("pg");

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "gaia",
//   password: "1234",
//   port: 5432,
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Вмикаємо ssl лише якщо в рядку або env прямо вказано sslmode=require
  ssl:
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : false,
});

module.exports = pool;
