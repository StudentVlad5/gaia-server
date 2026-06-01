const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");

router.get("/shipping/live-status", ordersController.getLiveStatus);
router.get(
  "/products/:productId/average-weight",
  ordersController.getAverageWeight,
);

router.post("/", ordersController.create);
router.get("/", ordersController.getAll);
router.get("/:id", ordersController.getOne);
router.put("/:id", ordersController.update);
router.delete("/:id", ordersController.delete);

module.exports = router;
