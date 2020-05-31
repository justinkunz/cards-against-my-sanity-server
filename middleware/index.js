const { token } = require("../utils");
const scheduler = require("node-schedule");
const db = require("../firebase");
const logger = require("../utils/logger")("MIDDLEWARE");

/**
 * Middleware - Validates a user's JWT token for restricted routes
 * Extracts playerId
 */
const validateToken = (req, res, next) => {
  try {
    const jwtToken = req.header("Authorization");
    const { playerId } = token.verify(jwtToken);

    logger(`req from player ${playerId}`);
    req.playerId = playerId;

    next();
  } catch (err) {
    logger.error("Bad Token", { err, token: req.header("Authorization") });
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
    const game = await db.Games.read(gameId);
    if (!game) throw "Game not found";

    req.game = game;
    next();
  } catch (err) {
    logger.error("Invalid Game", { err, params: req.params });
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
    logger.error("Join attempt after start", { err, params: req.params });
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
    logger.error("Player not found in game", { game, playerId });
    res.status(401).send("Unauthorized - User is not a player in this game");
  } else {
    logger(`req by ${player.name}`);
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
    logger.error(
      "Cardzar action attempted by non cardzar",
      { game, playerId, player: game.players[playerId] },
    );
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
    logger.error(
      "VIP action attempted by non VIP",
      { game, playerId, player: game.players[playerId] },
    );
    res.status(401).send("Unauthorized - user is not VIP");
  }
};

/**
 * Reschedules Game deletion
 * Game deletes after 30 minutes of inactivity
 */
const scheduleDelete = (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { scheduledJobs } = scheduler;
    if (scheduledJobs[gameId]) scheduledJobs[gameId].cancel();

    // Schedule delete 30 minutes out
    const offsetMinuts = 30;
    const now = new Date();
    const deleteAt = new Date(now.getTime() + offsetMinuts * 60000);

    scheduler.scheduleJob(gameId, deleteAt, () => {
      try {
        logger("DELETING GAME", gameId);
        db.Games.delete(gameId);
      } catch (err) {
        logger("Error deleting game", err);
      }
    });

    next();
  } catch (err) {
    logger("Error scheduling deletion", err);
    next();
  }
};
module.exports = {
  validateToken,
  validateGame,
  validatePlayer,
  rejectInProgressGame,
  isCardzar,
  scheduleDelete,
  isVIP,
};
