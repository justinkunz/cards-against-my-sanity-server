const { token, scheduleDelete } = require("../utils");
const db = require("../firebase");

/**
 * Middleware - Validates a user's JWT token for restricted routes
 * Extracts playerId
 */
const validateToken = (req, res, next) => {
  try {
    const jwtToken = req.header("Authorization");
    const { playerId } = token.verify(jwtToken);

    console.log(`req from player ${playerId}`);
    req.playerId = playerId;

    next();
  } catch (err) {
    res.status(401).send("Unauthorized - Bad token");
  }
};

/**
 * Middleware - Validates Game Exists
 */
const validateGame = async (req, res, next) => {
  // Validate Game Exists
  try {
    const { gameId } = req.params;
    scheduleDelete(gameId);
    const game = await db.Games.read(gameId);
    if (!game) throw "Game not found";

    req.game = game;
    next();
  } catch (err) {
    // console.log(err);
    res.status(404).send("Unauthorized - Game does not exist");
  }
};

/**
 * Middleware - Rejects a request if Game has started
 * for adding players
 * (validateGame must run first)
 */
const rejectInProgressGame = async (req, res, next) => {
  if (req.game.hasStarted) {
    res.status(401).send("Unauthorized - Game has already started");
  } else {
    next();
  }
};

/**
 * Middleware - Validates player is a member of game
 * (validateToken & validateGame must run first)
 */
const validatePlayer = (req, res, next) => {
  const { game, playerId } = req;
  const player = game.players[playerId];
  if (!player) {
    res.status(401).send("Unauthorized - User is not a player in this game");
  } else {
    console.log(`req by ${player.name}\n`);
    req.player = player;
    next();
  }
};

/**
 * Middleware - Validates player is cardzar
 * (validateToken & validateGame must run first)
 */
const isCardzar = (req, res, next) => {
  const { game, playerId } = req;
  if (game.players[playerId].isCardzar) {
    next();
  } else {
    res.status(401).send("Unauthorized - user is not cardzar");
  }
};

/**
 * Middleware - Validates player is VIP
 * (validateToken & validateGame must run first)
 */
const isVIP = (req, res, next) => {
  const { game, playerId } = req;
  if (game.players[playerId].isVIP) {
    next();
  } else {
    res.status(401).send("Unauthorized - user is not VIP");
  }
};

module.exports = {
  validateToken,
  validateGame,
  validatePlayer,
  rejectInProgressGame,
  isCardzar,
  isVIP,
};
