const express = require("express");
const router = express.Router();

const controller = require("../controllers/containers.controller");

router.get("/state", controller.getState);
router.post("/", controller.addContainer);
router.delete("/:id", controller.removeContainer);
router.put("/limit", controller.updateLimit);

// factories
router.get("/factories", controller.getFactories);
router.post("/factories", controller.addFactory);
router.put("/factories/:id", controller.updateFactory);

module.exports = router;
