const express = require("express");
const router = express.Router();
const controller = require("../controllers/reports.controller");

router.get("/by-days", controller.byDays);
router.get("/by-products", controller.byProducts);
router.get("/by-receivers", controller.byReceivers);
router.get("/summary", controller.summary);
router.get("/today-receivers", controller.getTodayReceivers);

module.exports = router;
