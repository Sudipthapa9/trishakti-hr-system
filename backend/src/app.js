const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/test.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/test", testRoutes);

app.use(errorHandler);

module.exports = app;