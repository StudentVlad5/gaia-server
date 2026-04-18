const express = require("express");
const router = express.Router();
const controller = require("../controllers/boxes.controller");

router.get("/", controller.getBoxes);
router.post("/", controller.createBox);
router.put("/:id", controller.updateBox);
router.delete("/:id", controller.deleteBox);

module.exports = router;
