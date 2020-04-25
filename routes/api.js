const router = require("express").Router();
const {
  createGame,
  beginGame,
  addPlayer,
  getPlayerInfo,
  submitCard,
  selectWinner,
  resetRound,
  getDeck,
  playAgain,
} = require("../controllers");

router.route("/").post(createGame);

router.route("/:gameId/start").post(beginGame);

router.route("/:gameId/player").post(addPlayer).get(getPlayerInfo);

router.route("/:gameId/card").post(submitCard);

router.route("/:gameId/round").post(selectWinner);

router.route("/:gameId/round/reset").post(resetRound);
router.route("/:gameId/reset").post(playAgain);

router.route("/deck").get(getDeck);

module.exports = router;
