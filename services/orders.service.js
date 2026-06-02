const db = require("../db");

class OrdersService {
  async _getCurrentAvgWeight(productId) {
    const res = await db.query(
      `SELECT COALESCE(AVG(weight / COALESCE(boxes_count, 1)), 0)::numeric(10,2) as average_weight
       FROM boxes 
       WHERE product_id = $1`,
      [productId],
    );
    return Number(res.rows[0].average_weight) || 0;
  }

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
        const currentAvgWeight =
          item.avg_weight || (await this._getCurrentAvgWeight(item.product_id));

        await client.query(
          `INSERT INTO order_items (order_id, product_id, planned_boxes, avg_weight_snapshot) 
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.product_id, item.planned_boxes, currentAvgWeight],
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

    // Повертаємо avg_weight_snapshot як avg_weight для фронтенду
    const itemsRes = await db.query(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.planned_boxes, 
              oi.avg_weight_snapshot as avg_weight, p.name as product_name 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,
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
             SUM(oi.planned_boxes)::int as total_planned_boxes,
             -- Розрахунок на основі збережених снепшотів ваги
             COALESCE(SUM(oi.planned_boxes * oi.avg_weight_snapshot), 0)::numeric(10,2) as total_expected_weight
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
          const currentAvgWeight =
            item.avg_weight ||
            (await this._getCurrentAvgWeight(item.product_id));

          await client.query(
            `INSERT INTO order_items (order_id, product_id, planned_boxes, avg_weight_snapshot) 
             VALUES ($1, $2, $3, $4)`,
            [id, item.product_id, item.planned_boxes, currentAvgWeight],
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

  async getProductAverageWeight(productId) {
    const avgWeight = await this._getCurrentAvgWeight(productId);
    return { average_weight: avgWeight };
  }

  async getLiveShippingStatus() {
    const sql = `
    WITH plan_data AS (
      -- Збираємо все, що було заплановано
      SELECT 
        o.id as order_id,
        o.receiver_id,
        o.date_start,
        o.date_end,
        oi.product_id,
        oi.planned_boxes,
        oi.avg_weight_snapshot as avg_weight
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'active' 
        AND CURRENT_DATE BETWEEN o.date_start AND o.date_end
    ),
    fact_data AS (
      -- Збираємо все, що фактично упакували в межах дат активних ордерів
      SELECT 
        o.id as order_id,
        b.receiver_id,
        b.product_id,
        SUM(b.boxes_count)::int as packed_boxes,
        SUM(b.weight)::numeric(10,2) as packed_weight
      FROM orders o
      JOIN boxes b ON b.receiver_id = o.receiver_id
      WHERE o.status = 'active'
        AND CURRENT_DATE BETWEEN o.date_start AND o.date_end
        AND b.date >= o.date_start 
        AND b.date <= (o.date_end + INTERVAL '1 day')
      GROUP BY o.id, b.receiver_id, b.product_id
    ),
    combined_data AS (
      -- Об'єднуємо ПЛАН і ФАКТ за допомогою FULL JOIN
      SELECT 
        COALESCE(p.order_id, f.order_id) as order_id,
        COALESCE(p.receiver_id, f.receiver_id) as receiver_id,
        COALESCE(p.product_id, f.product_id) as product_id,
        COALESCE(p.planned_boxes, 0) as planned_boxes,
        COALESCE(p.avg_weight, 0) as avg_weight,
        COALESCE(f.packed_boxes, 0) as packed_boxes,
        COALESCE(f.packed_weight, 0) as packed_weight,
        -- Прапорець: якщо в плані немає коробки, то вона непередбачена
        CASE WHEN p.product_id IS NULL THEN TRUE ELSE FALSE END as is_unexpected
      FROM plan_data p
      FULL OUTER JOIN fact_data f 
        ON p.order_id = f.order_id AND p.product_id = f.product_id
    )
    -- Фінальний селект з підтягуванням імен продуктів та отримувачів
    SELECT 
      c.*,
      r.name as receiver_name,
      p.name as product_name,
      o.date_start,
      o.date_end
    FROM combined_data c
    JOIN orders o ON c.order_id = o.id
    JOIN receivers r ON c.receiver_id = r.id
    JOIN products p ON c.product_id = p.id
    ORDER BY c.order_id, c.is_unexpected, p.name;
  `;

    const res = await db.query(sql);

    const ordersMap = {};
    res.rows.forEach((row) => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          id: row.order_id,
          receiver_id: row.receiver_id,
          receiver_name: row.receiver_name,
          date_start:
            row.date_start instanceof Date
              ? row.date_start.toISOString().split("T")[0]
              : row.date_start,
          date_end:
            row.date_end instanceof Date
              ? row.date_end.toISOString().split("T")[0]
              : row.date_end,
          items: [],
        };
      }

      ordersMap[row.order_id].items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        planned_boxes: Number(row.planned_boxes) || 0,
        packed_boxes: Number(row.packed_boxes) || 0,
        avg_weight: Number(row.avg_weight) || 0,
        packed_weight: Number(row.packed_weight) || 0,
        is_unexpected: row.is_unexpected,
      });
    });

    return Object.values(ordersMap);
  }
}

module.exports = new OrdersService();
