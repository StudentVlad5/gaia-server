const fs = require("fs");
const pool = require("../db");

const initDB = async () => {
  const sql = fs.readFileSync("./db/schema.sql").toString();
  await pool.query(sql);
  console.log("Schema applied");
};

module.exports = initDB;
