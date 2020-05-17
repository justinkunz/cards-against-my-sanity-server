const jwt = require("jsonwebtoken");
const adjectives = require("../data/ids/adjectives.json");
const nouns = require("../data/ids/nouns.json");
const scheduler = require("node-schedule");
const allCards = require("../data/combinedCards.json");
const { JWT_SECRET, ENV_PREFIX } = process.env;

const getCardById = (id) => {
  const color = id.startsWith("bl") ? "black" : "white";
  const { text } = allCards[color].find((card) => card.id === id);

  return { text, id };
};
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

const token = {
  sign: (data) => jwt.sign(data, JWT_SECRET),
  verify: (token) => jwt.verify(token, JWT_SECRET),
};

const generateGameCode = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${ENV_PREFIX || ""}${adj}-${noun}`.toLowerCase();
};

const scheduleDelete = (gameId) => {
  const db = require("../firebase");
  const { scheduledJobs } = scheduler;
  if (scheduledJobs[gameId]) scheduledJobs[gameId].cancel();

  const offsetMinuts = 30;
  const now = new Date();
  const deleteAt = new Date(now.getTime() + offsetMinuts * 60000);

  scheduler.scheduleJob(gameId, deleteAt, () => {
    console.log("DELETING", gameId);
    db.Games.delete(gameId);
  });
};

const errorLog = (type, details) => {
  console.log(`::ERROR:: ${type}`);
  for (key in details) {
    console.log(key, "->", details[key]);
  }
};

module.exports = {
  generateNewGameBody,
  shuffle,
  token,
  generateGameCode,
  scheduleDelete,
  errorLog,
  getCardById,
};
