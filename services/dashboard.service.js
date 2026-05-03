const pool = require("../db");

const getDashboard = async () => {
  const client = await pool.connect();

  try {
    // 1. summary
    const summaryRes = await client.query(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(actual_weight), 0) as total_weight
      FROM packagings
      WHERE created_at::date = CURRENT_DATE
    `);

    // 2. today list
    const todayRes = await client.query(`
      SELECT 
        p.*,
        pp.name as product_name,
        pp.category,
        f.name as factory_name
      FROM packagings p
      JOIN package_products pp ON pp.id = p.product_id
      LEFT JOIN factories f ON f.id = p.factory_id
      WHERE p.created_at::date = CURRENT_DATE
      ORDER BY p.created_at DESC
    `);

    // 3. completed today
    const completedRes = await client.query(`
      SELECT 
        p.*,
        pp.name as product_name,
        pp.category,
        f.name as factory_name
      FROM packagings p
      JOIN package_products pp ON pp.id = p.product_id
      LEFT JOIN factories f ON f.id = p.factory_id
      WHERE p.is_completed = true
        AND p.packed_at::date = CURRENT_DATE
      ORDER BY p.packed_at DESC
    `);

    // 4. grouped issues
    const issuesGroupedRes = await client.query(`
      SELECT 
        pp.category,
        COUNT(*) as count,
        COALESCE(SUM(p.difference), 0) as total_difference
      FROM packagings p
      JOIN package_products pp ON pp.id = p.product_id
      WHERE p.is_completed = false
      GROUP BY pp.category
      ORDER BY pp.category
    `);

    // 5. issues list
    const issuesListRes = await client.query(`
      SELECT 
        p.*,
        pp.name as product_name,
        pp.category,
        f.name as factory_name
      FROM packagings p
      JOIN package_products pp ON pp.id = p.product_id
      LEFT JOIN factories f ON f.id = p.factory_id
      WHERE p.is_completed = false
      ORDER BY pp.category, p.created_at
    `);

    return {
      summary: summaryRes.rows[0],
      today: todayRes.rows,
      completed: completedRes.rows,
      issues: {
        grouped: issuesGroupedRes.rows,
        list: issuesListRes.rows,
      },
    };
  } finally {
    client.release();
  }
};

module.exports = {
  getDashboard,
};
