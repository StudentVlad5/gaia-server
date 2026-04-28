const containersService = require("../services/containers.service");

const initContainersSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Containers socket connected");

    socket.on("container:add", async (data) => {
      await containersService.addContainer(data);

      const state = await containersService.getState();
      io.emit("containers:update", state);
    });

    socket.on("container:remove", async (id) => {
      await containersService.removeContainer(id);

      const state = await containersService.getState();
      io.emit("containers:update", state);
    });

    socket.on("container:updateLimit", async ({ type, total }) => {
      await containersService.updateLimit(type, total);

      const state = await containersService.getState();
      io.emit("containers:update", state);
    });
  });
};

module.exports = initContainersSocket;
