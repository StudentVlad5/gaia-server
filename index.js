require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const boxesRoutes = require("./routes/boxes.routes");
const productsRoutes = require("./routes/products.routes");
const receiversRoutes = require("./routes/receivers.routes");
const reportsRoutes = require("./routes/reports.routes");
const boxesController = require("./controllers/boxes.controller");
const containersRoutes = require("./routes/containers.routes");
const containersController = require("./controllers/containers.controller");
const initContainersSocket = require("./socket/containers.socket");

const initDB = require("./db/init");
initDB();

const app = express();

const server = http.createServer(app);

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
};

const io = new Server(server, {
  cors: corsOptions,
});

boxesController.setIO(io);
containersController.setIO(io);

initContainersSocket(io);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Gaia Server is running...");
});

app.use("/boxes", boxesRoutes);
app.use("/products", productsRoutes);
app.use("/receivers", receiversRoutes);
app.use("/reports", reportsRoutes);
app.use("/auth", require("./routes/auth.routes"));
app.use("/users", require("./routes/users.routes"));
app.use("/containers", containersRoutes);

io.on("connection", (socket) => {
  console.log("User connected");
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
