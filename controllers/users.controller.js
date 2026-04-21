const usersService = require("../services/users.service");

const getUsers = async (req, res) => {
  const users = await usersService.getAllUsers();
  res.json(users);
};

const changeRole = async (req, res) => {
  const { role } = req.body;

  if (!["ADMIN", "USER"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  await usersService.updateRole(req.params.id, role);

  res.json({ ok: true });
};

module.exports = {
  getUsers,
  changeRole,
};
