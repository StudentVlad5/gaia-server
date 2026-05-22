const pool = require("../db");

const buildFilters = (filters, values) => {
  let where = "WHERE 1=1";

  if (filters.product_id) {
    values.push(filters.product_id);
    where += ` AND p.product_id = $${values.length}`;
  }

  if (filters.factory_id) {
    values.push(filters.factory_id);
    where += ` AND p.factory_id = $${values.length}`;
  }

  if (filters.completed !== undefined) {
    values.push(filters.completed === "true");
    where += ` AND p.is_completed = $${values.length}`;
  }

  if (filters.date_from) {
    values.push(filters.date_from);
    where += ` AND p.created_at::date >= $${values.length}::date`;
  }

  if (filters.date_to) {
    values.push(filters.date_to);
    where += ` AND p.created_at::date <= $${values.length}::date`;
  }

  return where;
};

// GET ALL
const getAllPackagings = async ({ page = 1, limit = 10, ...filters }) => {
  const values = [];
  const where = buildFilters(filters, values);

  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      p.*,
      pp.name as product_name,
      pp.category,
      pp.standard_weight as product_standard_weight,
      f.name as factory_name
    FROM packagings p
    JOIN package_products pp ON pp.id = p.product_id
    LEFT JOIN factories f ON f.id = p.factory_id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  values.push(limit, offset);

  const dataResult = await pool.query(query, values);

  const countValues = [];
  const countWhere = buildFilters(filters, countValues);

  const countQuery = `
    SELECT COUNT(*) FROM packagings p
    ${countWhere}
  `;

  const countResult = await pool.query(countQuery, countValues);

  return {
    rows: dataResult.rows,
    total: Number(countResult.rows[0].count),
  };
};

// GET ONE
const getPackagingById = async (id) => {
  const res = await pool.query(
    `
    SELECT 
      p.*,
      pp.name as product_name,
      pp.category,
      pp.standard_weight,
      f.name as factory_name
    FROM packagings p
    JOIN package_products pp ON pp.id = p.product_id
    LEFT JOIN factories f ON f.id = p.factory_id
    WHERE p.id = $1
    `,
    [id],
  );

  return res.rows[0];
};

// CREATE
const createPackaging = async (data) => {
  const { product_id, factory_id, actual_weight, packed_at } = data;

  if (!product_id || !actual_weight) {
    throw new Error("product_id and actual_weight are required");
  }

  const productRes = await pool.query(
    `SELECT standard_weight FROM package_products WHERE id=$1`,
    [product_id],
  );

  if (!productRes.rows.length) {
    throw new Error("Product not found");
  }

  const standard_weight = productRes.rows[0].standard_weight;

  const is_completed = Number(actual_weight) === Number(standard_weight);

  if (is_completed && !packed_at) {
    throw new Error("packed_at required when completed");
  }

  const result = await pool.query(
    `
    INSERT INTO packagings (
      product_id,
      factory_id,
      actual_weight,
      standard_weight,
      is_completed,
      packed_at
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      product_id,
      factory_id || null,
      actual_weight,
      standard_weight,
      is_completed,
      packed_at || null,
    ],
  );

  return result.rows[0];
};

// UPDATE
const updatePackaging = async (id, data) => {
  const existingRes = await pool.query(`SELECT * FROM packagings WHERE id=$1`, [
    id,
  ]);

  if (!existingRes.rows.length) return null;

  const existing = existingRes.rows[0];

  const newProductId = data.product_id || existing.product_id;
  const newWeight =
    data.actual_weight !== undefined
      ? data.actual_weight
      : existing.actual_weight;

  const productRes = await pool.query(
    `SELECT standard_weight FROM package_products WHERE id=$1`,
    [newProductId],
  );

  if (!productRes.rows.length) {
    throw new Error("Product not found");
  }

  const standard_weight = productRes.rows[0].standard_weight;

  const is_completed = Number(newWeight) === Number(standard_weight);

  if (is_completed && !data.packed_at && !existing.packed_at) {
    throw new Error("packed_at required when completed");
  }

  const result = await pool.query(
    `
    UPDATE packagings
    SET 
      product_id = $1,
      factory_id = $2,
      actual_weight = $3,
      standard_weight = $4,
      is_completed = $5,
      packed_at = $6
    WHERE id = $7
    RETURNING *
    `,
    [
      newProductId,
      data.factory_id ?? existing.factory_id,
      newWeight,
      standard_weight,
      is_completed,
      data.packed_at ?? existing.packed_at,
      id,
    ],
  );

  return result.rows[0];
};

// DELETE
const deletePackaging = async (id) => {
  await pool.query(`DELETE FROM packagings WHERE id=$1`, [id]);
};

// TOTAL WEIGHT
const getTotalWeight = async (filters = {}) => {
  const values = [];
  const where = buildFilters(filters, values);

  const query = `
    SELECT COALESCE(SUM(actual_weight), 0) as total_weight
    FROM packagings p
    ${where}
  `;

  const result = await pool.query(query, values);

  return Number(result.rows[0].total_weight);
};

const getPackagingsForExport = async (filters) => {
  const values = [];
  const where = buildFilters(filters, values);

  const query = `
    SELECT 
      p.*,
      pp.name as product_name,
      pp.category,
      pp.standard_weight as product_standard_weight,
      f.name as factory_name
    FROM packagings p
    JOIN package_products pp ON pp.id = p.product_id
    LEFT JOIN factories f ON f.id = p.factory_id
    ${where}
    ORDER BY p.created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

module.exports = {
  getAllPackagings,
  createPackaging,
  updatePackaging,
  deletePackaging,
  getPackagingById,
  getTotalWeight,
  getPackagingsForExport,
};
