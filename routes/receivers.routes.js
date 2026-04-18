const express = require("express");
const router = express.Router();

const controller = require("../controllers/receivers.controller");

router.get("/", controller.getReceivers);
router.post("/", controller.createReceiver);
router.put("/:id", controller.updateReceiver);
router.delete("/:id", controller.deleteReceiver);

module.exports = router;
