const containersService = require("../services/containers.service");

let io;

const setIO = (_io) => {
  io = _io;
};

const getState = async (req, res) => {
  try {
    const data = await containersService.getState();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD
const addContainer = async (req, res) => {
  try {
    const container = await containersService.addContainer(req.body);

    const state = await containersService.getState();
    io.emit("containers:update", state);

    res.json(container);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// REMOVE
const removeContainer = async (req, res) => {
  try {
    const { id } = req.params;

    await containersService.removeContainer(id);

    const state = await containersService.getState();
    io.emit("containers:update", state);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE LIMIT
const updateLimit = async (req, res) => {
  try {
    const { type, total } = req.body;

    await containersService.updateLimit(type, total);

    const state = await containersService.getState();
    io.emit("containers:update", state);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// factories
const getFactories = async (req, res) => {
  try {
    const data = await containersService.getFactories();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addFactory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Factory name is required" });
    }

    const factory = await containersService.addFactory(name);

    res.json(factory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateFactory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const factory = await containersService.updateFactory(id, name);

    res.json(factory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  setIO,
  getState,
  addContainer,
  removeContainer,
  updateLimit,
  getFactories,
  addFactory,
  updateFactory,
};
