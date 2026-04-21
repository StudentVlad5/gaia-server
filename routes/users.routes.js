const router = require("express").Router();
const controller = require("../controllers/users.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.get("/", auth, controller.getUsers);
// router.get("/", auth, role("ADMIN"), controller.getUsers);
router.put("/:id/role", auth, controller.changeRole);
// router.put("/:id/role", auth, role("ADMIN"), controller.changeRole);

module.exports = router;
