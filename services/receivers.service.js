const pool = require("../db");

const getAll = async () => {
  const res = await pool.query("SELECT * FROM receivers ORDER BY name ASC");
  return res.rows;
};

const create = async (data) => {
  const { name } = data;

  const res = await pool.query(
    "INSERT INTO receivers(name) VALUES($1) RETURNING *",
    [name],
  );

  return res.rows[0];
};

const update = async (id, data) => {
  const { name } = data;

  const res = await pool.query(
    "UPDATE receivers SET name=$1 WHERE id=$2 RETURNING *",
    [name, id],
  );

  return res.rows[0];
};

const remove = async (id) => {
  const check = await pool.query(
    "SELECT 1 FROM boxes WHERE receiver_id=$1 LIMIT 1",
    [id],
  );

  if (check.rows.length > 0) {
    throw new Error("RECEIVER_IN_USE");
  }

  await pool.query("DELETE FROM receivers WHERE id=$1", [id]);
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
