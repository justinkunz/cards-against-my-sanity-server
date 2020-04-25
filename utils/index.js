const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const generateNewGameBody = (packs, winningScore, refresh = false) => {
  if (!packs) packs = [];
  if (!winningScore) winningScore = 10;

  const { CardDeck } = require("../classes");
  const cardDeck = new CardDeck(packs);
  const { blackCards, whiteCards } = cardDeck;
  return {
    ...(refresh ? {} : { players: {} }),
    decks: {
      black: blackCards,
      white: whiteCards,
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
module.exports = { generateNewGameBody, shuffle, token };
