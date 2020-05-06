const router = require("express").Router();
const restricted = require("./restricted");
const unrestricted = require("./unrestricted");
const {
  validateToken,
  validateGame,
  validatePlayer,
  rejectInProgressGame,
} = require("./middleware");
const { addPlayer } = require("../controllers");

// Unrestricted routes (For creating a new game or getting expansion packs)
router.use("/api/game", unrestricted);

// Only unrestricted route to include :gameId param -
// Adds player to specified game
router
  .route("/api/game/:gameId/player")
  .post(validateGame, rejectInProgressGame, addPlayer);

// Restricted routes
router.use(
  "/api/game/:gameId",
  validateToken,
  validateGame,
  validatePlayer,
  restricted
);

module.exports = router;
