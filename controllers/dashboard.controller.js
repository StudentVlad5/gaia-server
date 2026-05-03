const dashboardService = require("../services/dashboard.service");

const getDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboard();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};
