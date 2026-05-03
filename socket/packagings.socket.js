const packagingsService = require("../services/packagings.service");

const initPackagingsSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Packagings socket connected");

    socket.on("packaging:create", async (data) => {
      await packagingsService.createPackaging(data);

      io.emit("packaging:update");
      io.emit("dashboard_update");
    });

    socket.on("packaging:update", async ({ id, data }) => {
      await packagingsService.updatePackaging(id, data);

      io.emit("packaging:update");
      io.emit("dashboard_update");
    });

    socket.on("packaging:delete", async (id) => {
      await packagingsService.deletePackaging(id);

      io.emit("packaging:update");
      io.emit("dashboard_update");
    });
  });
};

module.exports = initPackagingsSocket;
