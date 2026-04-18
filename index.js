require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const boxesRoutes = require("./routes/boxes.routes");
const productsRoutes = require("./routes/products.routes");
const receiversRoutes = require("./routes/receivers.routes");
const reportsRoutes = require("./routes/reports.routes");
const boxesController = require("./controllers/boxes.controller");

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

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Gaia Server is running...");
});

app.use("/boxes", boxesRoutes);
app.use("/products", productsRoutes);
app.use("/receivers", receiversRoutes);
app.use("/reports", reportsRoutes);

io.on("connection", (socket) => {
  console.log("User connected");
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
