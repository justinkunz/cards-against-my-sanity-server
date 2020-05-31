require("dotenv").config();
const express = require("express");
const history = require("connect-history-api-fallback");
const morgan = require("morgan");
const serveStatic = require("serve-static");
const path = require("path");
const app = express();
const routes = require("./routes");
const { PORT } = process.env;

app.use([
  history({
    verbose: false,
  }),
  express.urlencoded({ extended: true }),
  morgan(":method :url :status :res[content-length] - :response-time ms"),
  express.json(),
  routes,
  serveStatic(path.join(__dirname, "..", "dist")),
]);

app.listen(PORT || 8081);
