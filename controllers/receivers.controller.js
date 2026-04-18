const service = require("../services/receivers.service");

// GET
const getReceivers = async (req, res) => {
  const data = await service.getAll();

  res.json({
    success: true,
    data,
  });
};

// CREATE
const createReceiver = async (req, res) => {
  const receiver = await service.create(req.body);

  res.json({
    success: true,
    data: receiver,
  });
};

// UPDATE
const updateReceiver = async (req, res) => {
  const updated = await service.update(req.params.id, req.body);

  res.json({
    success: true,
    data: updated,
  });
};

// DELETE
const deleteReceiver = async (req, res) => {
  try {
    await service.remove(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    if (err.message === "RECEIVER_IN_USE") {
      return res.status(400).json({
        success: false,
        message: "Receiver is used in boxes and cannot be deleted",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getReceivers,
  createReceiver,
  updateReceiver,
  deleteReceiver,
};
