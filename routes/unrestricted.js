const router = require("express").Router();
const { createGame, getDeck } = require("../controllers");

router.route("/").post(createGame);

router.route("/deck").get(getDeck);

module.exports = router;
