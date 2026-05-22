const express = require("express");
const router = express.Router();
const controller = require("../controllers/packagings.controller");

router.get("/", controller.getPackagings);
router.post("/", controller.createPackaging);
router.put("/:id", controller.updatePackaging);
router.delete("/:id", controller.deletePackaging);
router.get("/export", controller.exportPackagingsToExcel);

module.exports = router;
