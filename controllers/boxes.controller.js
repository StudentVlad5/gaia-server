const boxesService = require("../services/boxes.service");

let io;

const setIO = (_io) => {
  io = _io;
};

const getBoxes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000,
      product_id,
      receiver_id,
      date_from,
      date_to,
      from,
      to,
    } = req.query;

    const filters = {
      product_id,
      receiver_id,
      date_from: from || date_from,
      date_to: to || date_to,
    };

    const data = await boxesService.getAllBoxes({
      page: Number(page),
      limit: Number(limit),
      ...filters,
    });

    const totalWeight = await boxesService.getTotalWeight(filters);

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
      message: "Failed to fetch boxes",
    });
  }
};

// CREATE
const createBox = async (req, res) => {
  try {
    const newBox = await boxesService.createBox(req.body);
    const fullBox = await boxesService.getBoxById(newBox.id);
    io.emit("box_created", fullBox);

    res.json({
      success: true,
      data: newBox,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to create box",
    });
  }
};

// UPDATE
const updateBox = async (req, res) => {
  try {
    const updated = await boxesService.updateBox(req.params.id, req.body);

    const fullBox = await boxesService.getBoxById(updated.id);

    io.emit("box_updated", fullBox);

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update box",
    });
  }
};

// DELETE
const deleteBox = async (req, res) => {
  try {
    await boxesService.deleteBox(req.params.id);

    io.emit("box_deleted", req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to delete box",
    });
  }
};

module.exports = {
  setIO,
  getBoxes,
  createBox,
  updateBox,
  deleteBox,
};
