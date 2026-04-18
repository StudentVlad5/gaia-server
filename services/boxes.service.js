const pool = require("../db");

const buildFilters = (filters, values) => {
  let where = "WHERE 1=1";

  if (filters.product_id) {
    values.push(filters.product_id);
    where += ` AND b.product_id = $${values.length}`;
  }

  if (filters.receiver_id) {
    values.push(filters.receiver_id);
    where += ` AND b.receiver_id = $${values.length}`;
  }

  if (filters.date_from) {
    values.push(filters.date_from);
    where += ` AND b.date::date >= $${values.length}::date`;
  }

  if (filters.date_to) {
    values.push(filters.date_to);
    where += ` AND b.date::date <= $${values.length}::date`;
  }

  return where;
};

const getAllBoxes = async ({ page = 1, limit = 10, ...filters }) => {
  const values = [];

  const where = buildFilters(filters, values);

  const offset = (page - 1) * limit;

  const dataQuery = `
    SELECT 
      b.id,
      b.date,
      b.weight,
      b.boxes_count,
      b.comment,
      p.id as product_id,
      p.name as product_name,
      r.id as receiver_id,
      r.name as receiver_name
    FROM boxes b
    LEFT JOIN products p ON p.id = b.product_id
    LEFT JOIN receivers r ON r.id = b.receiver_id
    ${where}
    ORDER BY b.date DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  values.push(limit, offset);

  const dataResult = await pool.query(dataQuery, values);

  const countValues = [];
  const countWhere = buildFilters(filters, countValues);

  const countQuery = `
    SELECT COUNT(*) FROM boxes b
    ${countWhere}
  `;

  const countResult = await pool.query(countQuery, countValues);

  return {
    rows: dataResult.rows,
    total: Number(countResult.rows[0].count),
  };
};

const getBoxById = async (id) => {
  const res = await pool.query(
    `
    SELECT 
      b.*,
      p.name as product_name,
      r.name as receiver_name
    FROM boxes b
    LEFT JOIN products p ON p.id = b.product_id
    LEFT JOIN receivers r ON r.id = b.receiver_id
    WHERE b.id = $1
  `,
    [id],
  );

  return res.rows[0];
};

const createBox = async (data) => {
  const { weight, product_id, boxes_count = 1, receiver_id, comment } = data;

  const query = `
    INSERT INTO boxes (weight, product_id, boxes_count, receiver_id, comment)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const result = await pool.query(query, [
    weight,
    product_id,
    boxes_count,
    receiver_id,
    comment,
  ]);

  return result.rows[0];
};

const updateBox = async (id, data) => {
  const { weight, product_id, boxes_count, receiver_id, comment } = data;

  const query = `
    UPDATE boxes
    SET 
      weight = $1,
      product_id = $2,
      boxes_count = $3,
      receiver_id = $4,
      comment = $5
    WHERE id = $6
    RETURNING *
  `;

  const result = await pool.query(query, [
    weight,
    product_id,
    boxes_count,
    receiver_id,
    comment,
    id,
  ]);

  return result.rows[0];
};

const deleteBox = async (id) => {
  await pool.query(`DELETE FROM boxes WHERE id = $1`, [id]);
};

const getTotalWeight = async (filters = {}) => {
  const values = [];
  const where = buildFilters(filters, values);

  const query = `
    SELECT COALESCE(SUM(weight), 0) as total_weight
    FROM boxes b
    ${where}
  `;

  const result = await pool.query(query, values);

  return Number(result.rows[0].total_weight);
};

const getBoxesForExport = async (filters) => {
  const values = [];
  const where = buildFilters(filters, values);

  const query = `
    SELECT 
      b.date,
      b.weight,
      b.boxes_count,
      b.comment,
      p.name as product_name,
      r.name as receiver_name
    FROM boxes b
    LEFT JOIN products p ON p.id = b.product_id
    LEFT JOIN receivers r ON r.id = b.receiver_id
    ${where}
    ORDER BY b.date DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

module.exports = {
  getAllBoxes,
  createBox,
  updateBox,
  deleteBox,
  getTotalWeight,
  getBoxById,
  getBoxesForExport,
};
