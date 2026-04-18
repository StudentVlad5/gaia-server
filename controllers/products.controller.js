const service = require("../services/products.service");

// GET
const getProducts = async (req, res) => {
  const data = await service.getAll();
  res.json({ success: true, data });
};

// CREATE
const createProduct = async (req, res) => {
  const { name } = req.body;

  const product = await service.create(name);

  res.json({
    success: true,
    data: product,
  });
};

// UPDATE
const updateProduct = async (req, res) => {
  const { name } = req.body;

  const updated = await service.update(req.params.id, name);

  res.json({
    success: true,
    data: updated,
  });
};

// DELETE
const deleteProduct = async (req, res) => {
  try {
    await service.remove(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    if (err.message === "PRODUCT_IN_USE") {
      return res.status(400).json({
        success: false,
        message: "Product is used in boxes and cannot be deleted",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
