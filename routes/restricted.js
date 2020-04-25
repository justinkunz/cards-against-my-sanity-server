const router = require("express").Router({ mergeParams: true });
const {
  beginGame,
  addPlayer,
  getPlayerInfo,
  submitCard,
  selectWinner,
  resetRound,
  playAgain,
  skipCard,
  manualStatusCheckFallback,
} = require("../controllers");

router.route("/start").post(beginGame);
router.route("/player").post(addPlayer).get(getPlayerInfo);
router.route("/card").post(submitCard).put(skipCard);
router.route("/round").post(selectWinner).get(manualStatusCheckFallback);
router.route("/round/reset").post(resetRound);
router.route("/reset").post(playAgain);

module.exports = router;
