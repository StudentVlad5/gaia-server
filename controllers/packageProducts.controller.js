const service = require("../services/packageProducts.service");

exports.getAll = async (req, res) => {
  const data = await service.getAll();
  res.json(data);
};

exports.create = async (req, res) => {
  const data = await service.create(req.body);
  res.json(data);
};

exports.update = async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  res.json(data);
};

exports.remove = async (req, res) => {
  await service.remove(req.params.id);
  res.json({ success: true });
};
