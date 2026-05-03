const packagingsService = require("../services/packagings.service");

let io;

const setIO = (_io) => {
  io = _io;
};

// GET
const getPackagings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000,
      product_id,
      factory_id,
      completed,
      date_from,
      date_to,
      from,
      to,
    } = req.query;

    const filters = {
      product_id,
      factory_id,
      completed,
      date_from: from || date_from,
      date_to: to || date_to,
    };

    const data = await packagingsService.getAllPackagings({
      page: Number(page),
      limit: Number(limit),
      ...filters,
    });

    const totalWeight = await packagingsService.getTotalWeight(filters);

    res.json({
      success: true,
      data: data.rows,
      meta: {
        total: data.total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(data.total / limit),
        total_weight: totalWeight,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packagings",
    });
  }
};

// CREATE
const createPackaging = async (req, res) => {
  try {
    const created = await packagingsService.createPackaging(req.body);

    const full = await packagingsService.getPackagingById(created.id);

    io.emit("packaging_created", full);

    res.json({
      success: true,
      data: created,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE
const updatePackaging = async (req, res) => {
  try {
    const updated = await packagingsService.updatePackaging(
      req.params.id,
      req.body,
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const full = await packagingsService.getPackagingById(updated.id);

    io.emit("packaging_updated", full);

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE
const deletePackaging = async (req, res) => {
  try {
    await packagingsService.deletePackaging(req.params.id);

    io.emit("packaging_deleted", req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to delete packaging",
    });
  }
};

module.exports = {
  setIO,
  getPackagings,
  createPackaging,
  updatePackaging,
  deletePackaging,
};
