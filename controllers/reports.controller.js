const pool = require("../db");
const reportsService = require("../services/reports.service");

const byDays = async (req, res) => {
  const { from, to } = req.query;

  const result = await pool.query(
    `
    SELECT DATE(date) as day, SUM(weight) as total_weight
    FROM boxes
    WHERE date BETWEEN $1 AND $2
    GROUP BY DATE(date)
    ORDER BY day ASC
    `,
    [from, to],
  );

  res.json({ success: true, data: result.rows });
};

const byProducts = async (req, res) => {
  const { from, to } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT 
        p.name, 
        SUM(b.weight) as total_weight, 
        COUNT(b.id) as total_boxes
      FROM boxes b
      LEFT JOIN products p ON p.id = b.product_id
      WHERE b.date BETWEEN $1 AND $2
      GROUP BY p.name
      ORDER BY total_weight DESC
    `,
      [from, to],
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const byReceivers = async (req, res) => {
  const { from, to } = req.query;

  const result = await pool.query(
    `
    SELECT 
      r.name, 
      SUM(b.weight) as total_weight, 
      COUNT(b.id) as total_boxes,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'product_name', p.name,
          'total_weight', sub.item_weight,
          'total_boxes', sub.item_boxes
        )
      ) as items
    FROM receivers r
    LEFT JOIN boxes b ON r.id = b.receiver_id
    LEFT JOIN products p ON p.id = b.product_id
    LEFT JOIN (
      SELECT receiver_id, product_id, SUM(weight) as item_weight, COUNT(*) as item_boxes
      FROM boxes
      WHERE date BETWEEN $1 AND $2
      GROUP BY receiver_id, product_id
    ) sub ON sub.receiver_id = r.id AND sub.product_id = p.id
    WHERE b.date BETWEEN $1 AND $2
    GROUP BY r.name
    ORDER BY total_weight DESC
  `,
    [from, to],
  );

  res.json({ success: true, data: result.rows });
};

const summary = async (req, res) => {
  const { from, to } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT 
        COUNT(*) as total_boxes, 
        SUM(weight) as total_weight,
        AVG(weight) as avg_weight
      FROM boxes
      WHERE date BETWEEN $1 AND $2
    `,
      [from, to],
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getTodayReceivers = async (req, res) => {
  try {
    const data = await reportsService.getTodayReceivers();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("getTodayReceivers error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to load receivers analytics",
    });
  }
};

module.exports = {
  byDays,
  byProducts,
  byReceivers,
  summary,
  getTodayReceivers,
};
