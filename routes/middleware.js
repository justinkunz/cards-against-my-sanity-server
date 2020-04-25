const { token } = require("../utils");
const db = require("../firebase");

/**
 * Middleware - Validates a user's JWT token for restricted routes
 * Extracts playerId
 */
const validateToken = (req, res, next) => {
  try {
    const jwtToken = req.header("Authorization");
    const { playerId } = token.verify(jwtToken);
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
    const game = await db.Games.read(gameId);
    if (!game) throw "Game not found";

    req.game = game;
    next();
  } catch (err) {
    res.status(401).send("Unauthorized - Game does not exist");
  }
};

/**
 * Middleware - Validates player is a member of game
 * (validateToken & validateGame must run first)
 */
const validatePlayer = (req, res, next) => {
  const { game, playerId } = req;
  if (!game.players[playerId]) {
    res.status(401).send("Unauthorized - User is not a player in this game");
  } else {
    req.player = game.players[playerId];
    next();
  }
};

module.exports = { validateToken, validateGame, validatePlayer };
