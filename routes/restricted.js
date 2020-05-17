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
  refreshPlayerHand,
} = require("../controllers");

const { isVIP, isCardzar } = require("../middleware");

router.route("/start").post(isVIP, beginGame);
router.route("/player").get(getPlayerInfo);
router.route("/player/hand").delete(refreshPlayerHand);
router.route("/card").post(submitCard).put(skipCard);
router
  .route("/round")
  .post(isCardzar, selectWinner)
  .get(isCardzar, manualStatusCheckFallback);
router.route("/round/reset").post(isCardzar, resetRound);
router.route("/reset").post(playAgain);

module.exports = router;
