const packagingsService = require("../services/packagings.service");
const ExcelJS = require("exceljs");

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

const exportPackagingsToExcel = async (req, res) => {
  try {
    const { product_id, factory_id, date_from, date_to } = req.query;

    const filters = {
      product_id: product_id || null,
      factory_id: factory_id || null,
      date_from: date_from || null,
      date_to: date_to || null,
    };

    const data = await packagingsService.getPackagingsForExport(filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Packagings Journal");

    worksheet.columns = [
      { header: "Created At", key: "created_at", width: 20 },
      { header: "Product", key: "product_name", width: 25 },
      { header: "Category", key: "category", width: 15 },
      { header: "Factory", key: "factory_name", width: 25 },
      { header: "Norm (kg)", key: "standard_weight", width: 15 },
      { header: "Actual (kg)", key: "actual_weight", width: 15 },
      { header: "Diff (kg)", key: "difference", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, size: 12 };

    data.forEach((item) => {
      const norm = Number(item.standard_weight) || 0;
      const actual = Number(item.actual_weight) || 0;
      const diff = (actual - norm).toFixed(2);

      worksheet.addRow({
        created_at: new Date(item.created_at).toLocaleString(),
        product_name: item.product_name,
        category: item.category,
        factory_name: item.factory_name || "—",
        standard_weight: norm,
        actual_weight: actual,
        difference: Number(diff),
        status: item.is_completed ? "Ready" : "Pending",
      });
    });

    const fileName = `packagings_report_${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Error:", err);
    res.status(500).json({ success: false, message: "Export failed" });
  }
};

module.exports = {
  setIO,
  getPackagings,
  createPackaging,
  updatePackaging,
  deletePackaging,
  exportPackagingsToExcel,
};
