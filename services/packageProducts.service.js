const pool = require("../db");

exports.getAll = async () => {
  const { rows } = await pool.query(
    "SELECT * FROM package_products ORDER BY name",
  );
  return rows;
};

exports.create = async ({ name, category, standard_weight }) => {
  const { rows } = await pool.query(
    `INSERT INTO package_products (name, category, standard_weight)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, category, standard_weight],
  );
  return rows[0];
};

exports.update = async (id, { name, category, standard_weight }) => {
  const { rows } = await pool.query(
    `UPDATE package_products
     SET name=$1, category=$2, standard_weight=$3
     WHERE id=$4 RETURNING *`,
    [name, category, standard_weight, id],
  );
  return rows[0];
};

exports.remove = async (id) => {
  try {
    await pool.query(`DELETE FROM package_products WHERE id=$1`, [id]);
    return { success: true };
  } catch (error) {
    if (error.code === "23503") {
      throw new Error(
        "You can't remove this items. We have this production in our storage",
      );
    }
    throw error;
  }
};
