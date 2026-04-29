const pool = require("../db");

const getState = async () => {
  const containers = await pool.query(`
    SELECT 
      c.id, 
      c.type, 
      c.product, 
      f.name as factory, 
      c.created_at
    FROM containers c
    LEFT JOIN factories f ON c.factory_id = f.id
    ORDER BY c.created_at DESC
  `);

  const grouped = await pool.query(`
    SELECT 
      c.type, 
      c.product, 
      f.name as factory, 
      COUNT(*)::INT as count,
      ARRAY_AGG(c.id) as ids  
    FROM containers c
    LEFT JOIN factories f ON c.factory_id = f.id
    GROUP BY c.type, c.product, f.name
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

const addContainer = async ({ type, product, factoryId }) => {
  const totalRes = await pool.query(
    `SELECT total FROM container_settings WHERE type = $1`,
    [type],
  );

  const insertRes = await pool.query(
    `INSERT INTO containers (type, product, factory_id) 
     VALUES ($1, $2, $3) RETURNING *`,
    [type, product, factoryId],
  );

  return insertRes.rows[0];
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
