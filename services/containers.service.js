const pool = require("../db");

const getState = async () => {
  const containers = await pool.query(`
    SELECT id, type, product, factory
    FROM containers
    ORDER BY created_at DESC
  `);

  const grouped = await pool.query(`
    SELECT type, product, factory, COUNT(*) as count
    FROM containers
    GROUP BY type, product, factory
  `);

  const settings = await pool.query(`
    SELECT type, total FROM container_settings
  `);

  return {
    containers: containers.rows,
    grouped: grouped.rows,
    settings: settings.rows,
  };
};

const addContainer = async ({ type, product, factory }) => {
  const totalRes = await pool.query(
    `SELECT total FROM container_settings WHERE type = $1`,
    [type],
  );

  const usedRes = await pool.query(
    `SELECT COUNT(*) FROM containers WHERE type = $1`,
    [type],
  );

  const total = totalRes.rows[0].total;
  const used = parseInt(usedRes.rows[0].count);

  if (used >= total) {
    throw new Error("No free containers");
  }

  const result = await pool.query(
    `INSERT INTO containers (type, product, factory)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [type, product, factory],
  );

  return result.rows[0];
};

const removeContainer = async (id) => {
  const result = await pool.query(
    `DELETE FROM containers WHERE id = $1 RETURNING *`,
    [id],
  );

  if (result.rowCount === 0) {
    throw new Error("Container not found");
  }

  return result.rows[0];
};

const updateLimit = async (type, total) => {
  const result = await pool.query(
    `UPDATE container_settings
     SET total = $1
     WHERE type = $2
     RETURNING *`,
    [total, type],
  );

  return result.rows[0];
};

const getFactories = async () => {
  const res = await pool.query(`SELECT * FROM factories ORDER BY name`);
  return res.rows;
};

const addFactory = async (name) => {
  const res = await pool.query(
    `INSERT INTO factories (name)
     VALUES ($1)
     RETURNING *`,
    [name],
  );
  return res.rows[0];
};

const updateFactory = async (id, name) => {
  const res = await pool.query(
    `UPDATE factories
     SET name = $1
     WHERE id = $2
     RETURNING *`,
    [name, id],
  );
  return res.rows[0];
};

module.exports = {
  getState,
  addContainer,
  removeContainer,
  updateLimit,
  getFactories,
  addFactory,
  updateFactory,
};
