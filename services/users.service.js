const pool = require("../db");

const getAllUsers = async () => {
  const res = await pool.query(
    "SELECT id, username, role FROM users ORDER BY id",
  );
  return res.rows;
};

const updateRole = async (id, role) => {
  await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
};

module.exports = {
  getAllUsers,
  updateRole,
};
