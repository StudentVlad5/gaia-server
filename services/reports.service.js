// services/reports.service.js
const pool = require("../db");

const getTodayReceivers = async () => {
  const result = await pool.query(`
    SELECT 
      r.id as receiver_id,
      r.name as receiver_name,
      p.name as product_name,
      SUM(b.weight) as total_weight,
      COUNT(b.id) as total_boxes,
      SUM(SUM(b.weight)) OVER () as grand_total
    FROM boxes b
    JOIN receivers r ON r.id = b.receiver_id
    JOIN products p ON p.id = b.product_id
    WHERE DATE(b.date) = CURRENT_DATE
    GROUP BY r.id, p.id
  `);

  const rows = result.rows;

  const map = {};

  rows.forEach((row) => {
    const receiverId = row.receiver_id;

    if (!map[receiverId]) {
      map[receiverId] = {
        receiver_id: receiverId,
        receiver_name: row.receiver_name,
        total_weight: 0,
        total_boxes: 0,
        percentage: 0,
        products: [],
      };
    }

    map[receiverId].products.push({
      product_name: row.product_name,
      total_weight: Number(row.total_weight),
      boxes: Number(row.total_boxes),
    });

    map[receiverId].total_weight += Number(row.total_weight);
    map[receiverId].total_boxes += Number(row.total_boxes);
  });

  const grandTotal = rows.length ? Number(rows[0].grand_total) : 0;

  Object.values(map).forEach((r) => {
    r.percentage = grandTotal
      ? Number(((r.total_weight / grandTotal) * 100).toFixed(2))
      : 0;
  });

  return Object.values(map);
};

module.exports = {
  getTodayReceivers,
};
