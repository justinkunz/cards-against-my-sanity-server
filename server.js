require("dotenv").config();
const express = require("express");
const history = require("connect-history-api-fallback");
const morgan = require("morgan");
const serveStatic = require("serve-static");
const path = require("path");
const app = express();
const routes = require("./routes");
const { PORT } = process.env;
const { token } = require("./utils");

app.use([
  history({
    verbose: false,
  }),
  express.urlencoded({ extended: true }),
  morgan("\n:method :url :status :res[content-length] - :response-time ms"),
  express.json(),
  routes,
  serveStatic(path.join(__dirname, "..", "client", "dist")),
]);

app.listen(PORT || 8081);
