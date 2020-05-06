const db = require("../firebase");
const fs = require("fs");
const { generateNewGameBody, shuffle, token } = require("../utils");

/**
 * Create New Game Controller
 */
const createGame = async (req, res) => {
  console.log("Creating new game");
  const { packs, winningScore } = req.body.options;

  const gameId = await db.Games.create(
    generateNewGameBody(packs, winningScore)
  );

  res.json({ gameId });
};

/**
 * Begin Existing Game Controller
 */
const beginGame = async (req, res) => {
  console.log("Beginning game");
  const { game } = req;

  game.drawBlackCard();
  game.hasStarted = true;
  game.setRandomCardzar();
  await game.save();

  res.json({ status: "success" });
};

/**
 * Controller to add new player to game
 */
const addPlayer = async (req, res) => {
  const { game } = req;
  const { name } = req.body;
  const { gameId } = req.params;
  console.log(`Adding ${name} to ${gameId}`);

  const hand = game.generateHand();
  const isVIP = !game.players || game.players.length === 0;

  const playerId = await db.Players.create({
    gameId,
    hand,
    name,
    isVIP,
    cardsWon: [],
    submittedCard: {},
  });

  game.addPlayer(playerId, name, isVIP);
  await game.save();
  const jwtToken = token.sign({ playerId });
  res.json({ playerId, jwtToken, hand, isVIP });
};

/**
 * Controller for getting player info
 */
const getPlayerInfo = async (req, res) => {
  const { playerId, game } = req;
  console.log(`Getting player info for ${playerId}`);
  const player = await db.Players.read(playerId);
  game.updatePlayerTime(playerId);
  res.json({ ...player.dbVals(), playerId });
};

/**
 * Submitting Card Controller
 */
const submitCard = async (req, res) => {
  const { playerId, game } = req;
  const { cardId } = req.body;
  console.log(`${playerId} submitted ${cardId}`);
  const player = await db.Players.read(playerId);

  player.submittedCard = player.getCardById(cardId);
  game.recordCardSubmit(playerId);

  // Dont bundle - Fb can fail sometimes on update
  await game.save();
  await player.save();

  if (game.isRoundReady()) {
    const roundCards = await game.getAllPlayersCards();
    game.round.cards = shuffle(roundCards);
    game.round.ready = true;
    await game.save();
  }

  res.json(player.dbVals());
};

/**
 * Manually check if round is ready every 10 seconds via
 * expensive check. Firebase sometimes does not update the hasSubmitted field (suprise suprise)
 */
const manualStatusCheckFallback = async (req, res) => {
  const { game } = req;

  if (game.round && game.round.ready) return res.json(game.dbVals());

  const players = Object.keys(game.players);
  const roundCards = (await game.getAllPlayersCards()).filter((c) => !!c);

  console.log(
    `Manual Fallback check\n${roundCards.length} / ${
      players.length - 1
    } cards submitted `
  );
  if (roundCards.length === players.length - 1) {
    console.log("MANUAL FALLBACK CATCH");
    game.round.cards = shuffle(roundCards);
    game.round.ready = true;
    await game.save();
  }

  res.json(game.dbVals());
};
/**
 *  Controller for selecting winner
 */
const selectWinner = async (req, res) => {
  const { playerId, game } = req;
  const { cardId } = req.body;

  console.log(`${playerId} chose ${cardId} as round winner`);
  await game.recordRoundWinner(cardId);
  await game.save();
  res.json({ status: "success" });
};

/**
 * Controller to start new round
 */
const resetRound = async (req, res) => {
  const { game } = req;
  console.log(`Resetting round`);

  const players = await game.getAllPlayers();
  Promise.all(
    players.map(async (player) => {
      if (game.players[player.playerId].isCardzar) return;
      const cardId = player.submittedCard.id;
      player.replaceCard(cardId, game.drawWhiteCard());
      player.submittedCard = false;
      await player.save();
    })
  );

  game.resetRound();
  game.drawBlackCard();
  game.setNextCardzar();

  await game.save();
  res.json({ status: "success" });
};

/**
 * Controller to get expansion packs
 */
const getDeck = (req, res) => {
  console.log("Getting deck");
  const files = JSON.parse(fs.readFileSync("./data/packs.json", "utf-8"));
  const packs = files.map((f) => f.pack);
  res.json(packs);
};

/**
 * Controller to reset game after end
 */
const playAgain = async (req, res) => {
  console.log("Restarting game");
  const { game } = req;

  game.resetGame();
  game.resetRound();

  const playerIds = Object.keys(game.players);
  await Promise.all(
    playerIds.map(async (pid) => {
      const newHand = game.generateHand();
      const player = await db.Players.read(pid);
      player.reset(newHand);
      await player.save();
      return;
    })
  );

  game.drawBlackCard();
  game.setRandomCardzar();
  game.save();

  res.json({ status: "success" });
};

/**
 * Controller for skipping black card
 */
const skipCard = (req, res) => {
  console.log("Skipping card");
  const { game } = req;

  game.resetRound();
  game.drawBlackCard();
  game.save();

  res.json({ status: "success" });
};

module.exports = {
  createGame,
  beginGame,
  addPlayer,
  getPlayerInfo,
  submitCard,
  selectWinner,
  resetRound,
  getDeck,
  playAgain,
  skipCard,
  manualStatusCheckFallback,
};
