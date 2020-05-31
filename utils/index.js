const jwt = require("jsonwebtoken");
const adjectives = require("../data/ids/adjectives.json");
const nouns = require("../data/ids/nouns.json");
const allCards = require("../data/combinedCards.json");
const { JWT_SECRET, ENV_PREFIX } = process.env;

/**
 * Finds Card data by card id
 */
const getCardById = (id) => {
  const color = id.startsWith("bl") ? "black" : "white";
  const { text } = allCards[color].find((card) => card.id === id);

  return { text, id };
};

/**
 * Creates db body for game data
 */
const generateNewGameBody = (packs, winningScore, refresh = false) => {
  if (!packs) packs = [];
  if (!winningScore) winningScore = 10;

  const { CardDeck } = require("../classes");
  const cardDeck = new CardDeck(packs);
  const { blackCards, whiteCards } = cardDeck;
  return {
    ...(refresh ? {} : { players: {} }),
    decks: {
      black: blackCards.map((c) => c.id),
      white: whiteCards.map((c) => c.id),
    },
    expansion: packs,
    winner: {
      winningScore,
      winner: {},
    },
    gameOver: false,
    blackCard: {
      id: null,
      text: "Waiting on other players. . .",
    },
    hasStarted: refresh,
    round: {
      ready: false,
      cards: [],
      winner: {},
      winningCard: {},
      isComplete: false,
    },
  };
};

/**
 * Shuffles passed in array
 */
const shuffle = (a) => {
  const arr = [...a];
  for (let i = 0; i < arr.length; i++) {
    const switchPosition = Math.floor(Math.random() * arr.length);
    const tmp = arr[switchPosition];
    arr[switchPosition] = arr[i];
    arr[i] = tmp;
  }
  return arr;
};

/**
 * Controller for handling JWT tokens
 */
const token = {
  sign: (data) => jwt.sign(data, JWT_SECRET),
  verify: (token) => jwt.verify(token, JWT_SECRET),
};

/**
 * Creates a random adjective / noun game code
 */
const generateGameCode = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${ENV_PREFIX || ""}${adj}-${noun}`.toLowerCase();
};

module.exports = {
  generateNewGameBody,
  shuffle,
  token,
  generateGameCode,
  getCardById,
};
