const ordersService = require("../services/orders.service");

class OrdersController {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  emitUpdate() {
    if (this.io) {
      this.io.emit("orders_updated");
    }
  }
  async create(req, res, next) {
    try {
      const { receiver_id, date_start, date_end, items } = req.body;
      if (!receiver_id || !date_start || !date_end || !items?.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const newOrder = await ordersService.createOrder(req.body);
      res.status(201).json(newOrder);
    } catch (e) {
      next(e);
    }
  }

  async getAll(req, res, next) {
    try {
      const orders = await ordersService.getAllOrders(req.query);
      res.json({ data: orders });
    } catch (e) {
      next(e);
    }
  }

  async getOne(req, res, next) {
    try {
      const order = await ordersService.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch (e) {
      next(e);
    }
  }

  async update(req, res, next) {
    try {
      const updatedOrder = await ordersService.updateOrder(
        req.params.id,
        req.body,
      );
      res.json(updatedOrder);
    } catch (e) {
      next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await ordersService.deleteOrder(req.params.id);
      if (!success) return res.status(404).json({ error: "Order not found" });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }

  async getAverageWeight(req, res, next) {
    try {
      const data = await ordersService.getProductAverageWeight(
        req.params.productId,
      );
      res.json(data);
    } catch (e) {
      next(e);
    }
  }

  async getLiveStatus(req, res, next) {
    try {
      const liveData = await ordersService.getLiveShippingStatus();
      res.json(liveData);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new OrdersController();
