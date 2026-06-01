const db = require("../db");

class OrdersService {
  async createOrder({ receiver_id, date_start, date_end, items }) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const orderRes = await client.query(
        `INSERT INTO orders (receiver_id, date_start, date_end) 
         VALUES ($1, $2, $3) RETURNING *`,
        [receiver_id, date_start, date_end],
      );
      const orderId = orderRes.rows[0].id;

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, planned_boxes) 
           VALUES ($1, $2, $3)`,
          [orderId, item.product_id, item.planned_boxes],
        );
      }

      await client.query("COMMIT");
      return this.getOrderById(orderId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrderById(id) {
    const orderRes = await db.query(
      `SELECT o.*, r.name as receiver_name 
       FROM orders o JOIN receivers r ON o.receiver_id = r.id WHERE o.id = $1`,
      [id],
    );
    if (orderRes.rows.length === 0) return null;

    const itemsRes = await db.query(
      `SELECT oi.*, p.name as product_name 
       FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
      [id],
    );

    const order = orderRes.rows[0];
    order.items = itemsRes.rows;
    return order;
  }

  async getAllOrders({ status, receiver_id }) {
    let query = `
      SELECT o.*, r.name as receiver_name,
             COUNT(oi.id)::int as total_products,
             SUM(oi.planned_boxes)::int as total_planned_boxes
      FROM orders o
      JOIN receivers r ON o.receiver_id = r.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const values = [];
    const whereParts = [];

    if (status) {
      values.push(status);
      whereParts.push(`o.status = $${values.length}`);
    }
    if (receiver_id) {
      values.push(receiver_id);
      whereParts.push(`o.receiver_id = $${values.length}`);
    }

    if (whereParts.length > 0) {
      query += ` WHERE ` + whereParts.join(" AND ");
    }

    query += ` GROUP BY o.id, r.name ORDER BY o.date_start DESC`;
    const res = await db.query(query, values);
    return res.rows;
  }

  async updateOrder(id, { date_start, date_end, status, items }) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE orders SET date_start = $1, date_end = $2, status = $3 WHERE id = $4`,
        [date_start, date_end, status, id],
      );

      if (items) {
        await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);
        for (const item of items) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, planned_boxes) VALUES ($1, $2, $3)`,
            [id, item.product_id, item.planned_boxes],
          );
        }
      }

      await client.query("COMMIT");
      return this.getOrderById(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteOrder(id) {
    const res = await db.query("DELETE FROM orders WHERE id = $1", [id]);
    return res.rowCount > 0;
  }

  // Розрахунок середньої ваги коробки за існуючими даними
  async getProductAverageWeight(productId) {
    const res = await db.query(
      `SELECT COALESCE(AVG(weight / COALESCE(boxes_count, 1)), 0)::numeric(10,2) as average_weight
       FROM boxes 
       WHERE product_id = $1`,
      [productId],
    );
    return res.rows[0];
  }

  async getLiveShippingStatus() {
    const sql = `
      SELECT 
        o.id as order_id,
        o.receiver_id,
        r.name as receiver_name,
        o.date_start,
        o.date_end,
        oi.product_id,
        p.name as product_name,
        oi.planned_boxes,
        COALESCE(
          (SELECT SUM(b.boxes_count) 
           FROM boxes b 
           WHERE b.receiver_id = o.receiver_id 
             AND b.product_id = oi.product_id
             AND b.date >= o.date_start 
             AND b.date <= (o.date_end + INTERVAL '1 day')
          ), 0
        )::int as packed_boxes
      FROM orders o
      JOIN receivers r ON o.receiver_id = r.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'active' 
        AND CURRENT_DATE BETWEEN o.date_start AND o.date_end
      ORDER BY o.id, p.name
    `;

    const res = await db.query(sql);

    const ordersMap = {};
    res.rows.forEach((row) => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          id: row.order_id,
          receiver_id: row.receiver_id,
          receiver_name: row.receiver_name,
          date_start: row.date_start.toISOString().split("T")[0],
          date_end: row.date_end.toISOString().split("T")[0],
          items: [],
        };
      }
      ordersMap[row.order_id].items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        planned_boxes: row.planned_boxes,
        packed_boxes: row.packed_boxes,
      });
    });

    return Object.values(ordersMap);
  }
}

module.exports = new OrdersService();
