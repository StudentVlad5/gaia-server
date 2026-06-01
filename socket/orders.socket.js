const ordersService = require("../services/orders.service");
const boxesService = require("../services/boxes.service");

const initOrdersSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Orders & Shipping socket connected");

    socket.on("order:create", async (data) => {
      try {
        await ordersService.createOrder(data);
        io.emit("order:update");
        io.emit("shipping:live_update");
      } catch (error) {
        socket.emit("order:error", { message: "Error creating order" });
      }
    });

    socket.on("order:update", async ({ id, data }) => {
      try {
        await ordersService.updateOrder(id, data);
        io.emit("order:update");
        io.emit("shipping:live_update");
      } catch (error) {
        socket.emit("order:error", { message: "Error updating order" });
      }
    });

    socket.on("order:delete", async (id) => {
      try {
        await ordersService.deleteOrder(id);
        io.emit("order:update");
        io.emit("shipping:live_update");
      } catch (error) {
        socket.emit("order:error", { message: "Error deleting order" });
      }
    });

    socket.on("box:create", async (data) => {
      io.emit("box:updated");
      io.emit("shipping:live_update");
    });

    socket.on("box:update", async ({ id, data }) => {
      io.emit("box:updated");
      io.emit("shipping:live_update");
    });

    socket.on("box:delete", async (id) => {
      io.emit("box:updated");
      io.emit("shipping:live_update");
    });
  });
};

module.exports = initOrdersSocket;
