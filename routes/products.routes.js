const express = require("express");
const router = express.Router();

const controller = require("../controllers/products.controller");

router.get("/", controller.getProducts);
router.post("/", controller.createProduct);
router.put("/:id", controller.updateProduct);
router.delete("/:id", controller.deleteProduct);

module.exports = router;
