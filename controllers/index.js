const db = require('../firebase');
const fs = require('fs');
const logger = require('../utils/logger')('CONTROLLERS');
const { generateNewGameBody, shuffle, token, getCardById } = require('../utils');

/**
 * Create New Game Controller
 */
const createGame = async (req, res) => {
  logger('Creating Game');
  const { packs, winningScore } = req.body.options;

  const gameId = await db.Games.create(generateNewGameBody(packs, winningScore));

  res.json({ gameId });
};

/**
 * Begin Existing Game Controller
 */
const beginGame = async (req, res) => {
  logger('Beginning game');
  const { game } = req;

  game.drawBlackCard();
  game.hasStarted = true;
  game.setRandomCardzar();
  await game.save();

  res.json({ status: 'success' });
};

/**
 * Controller to add new player to game
 */
const addPlayer = async (req, res) => {
  const { game } = req;
  const { name } = req.body;
  const { gameId } = req.params;
  logger(`Adding ${name} to ${gameId}`);

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
  logger(`Getting player info for ${playerId}`);
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
  logger(`${playerId} submitted ${cardId}`);
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
  logger('Manual Fallback Check');
  if (game.round && game.round.ready) return res.json({ status: 'success' });

  const players = Object.keys(game.players);
  const roundCards = (await game.getAllPlayersCards()).filter((c) => !!c);

  if (roundCards.length === players.length - 1) {
    game.round.cards = shuffle(roundCards);
    game.round.ready = true;
    await game.save();
  }

  res.json({ status: 'success' });
};
/**
 *  Controller for selecting winner
 */
const selectWinner = async (req, res) => {
  const { playerId, game } = req;
  const { cardId } = req.body;

  logger(`${playerId} chose ${cardId} as round winner`);
  await game.recordRoundWinner(cardId);
  await game.save();
  res.json({ status: 'success' });
};

/**
 * Controller to start new round
 */
const resetRound = async (req, res) => {
  const { game } = req;
  logger('Resetting round');

  const players = await game.getAllPlayers();
  Promise.all(
    players.map(async (player) => {
      if (game.players[player.playerId].isCardzar) return;
      const cardId = player.submittedCard.id;
      player.replaceCard(cardId, getCardById(game.drawWhiteCard(cardId)));
      player.submittedCard = false;
      await player.save();
    })
  );

  game.resetRound();
  game.drawBlackCard();
  game.setNextCardzar();

  await game.save();
  res.json({ status: 'success' });
};

/**
 * Controller to get expansion packs
 */
const getDeck = (req, res) => {
  logger('Getting deck');
  const showAll = req.query.showAll === 'true';
  const files = JSON.parse(fs.readFileSync('./data/packs.json', 'utf-8'));
  const packs = showAll
    ? files.map((f) => f.pack)
    : files.filter((f) => f.primary).map((f) => f.pack);
  res.json(packs);
};

/**
 * Controller to reset game after end
 */
const playAgain = async (req, res) => {
  logger('Restarting game');
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
  await game.save();

  res.json({ status: 'success' });
};

/**
 * Controller for skipping black card
 */
const skipCard = async (req, res) => {
  logger('Skipping card');
  const { game } = req;

  game.resetRound();
  game.drawBlackCard();
  await game.save();

  res.json({ status: 'success' });
};

const refreshPlayerHand = async (req, res) => {
  logger('Refreshing hand');
  const { game, playerId } = req;

  const player = await db.Players.read(playerId);
  player.hand = game.generateHand();
  game.players[playerId].score = game.players[playerId].score - 2;
  await Promise.all([player.save(), game.save()]);

  res.json({ status: 'success' });
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
  refreshPlayerHand,
};
