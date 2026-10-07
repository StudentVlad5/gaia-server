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
const packagingsRoutes = require("./routes/packagings.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const packageProductsRoutes = require("./routes/packageProducts.routes");
const packagingsController = require("./controllers/packagings.controller");
const ordersController = require("./controllers/orders.controller");
const initContainersSocket = require("./socket/containers.socket");
const initPackagingsSocket = require("./socket/packagings.socket");
const initOrdersSocket = require("./socket/orders.socket");

const initDB = require("./db/init");
initDB();

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.CORS_ORIGIN || "*";
const corsOptions = {
  origin: allowedOrigin === "*" ? true : allowedOrigin.split(","),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("Gaia Server is running...");
});

app.get("/api", (req, res) => {
  res.send("Gaia Server API is running...");
});

boxesController.setIO(io);
containersController.setIO(io);
packagingsController.setIO(io);
ordersController.setIO(io);

initContainersSocket(io);
initPackagingsSocket(io);
initOrdersSocket(io);

app.use("/api/boxes", boxesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/receivers", receiversRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/packagings", packagingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/package-products", packageProductsRoutes);
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/containers", containersRoutes);
app.use("/api/orders", require("./routes/orders.routes"));

io.on("connection", (socket) => {
  console.log("User connected");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
