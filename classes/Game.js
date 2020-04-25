const Firebase = require("./Firebase");
const { generateNewGameBody } = require("../utils");

class Game extends Firebase {
  constructor(data, db, ref) {
    super(data, db, ref);
  }

  drawWhiteCard() {
    return this.decks.white.pop();
  }

  drawBlackCard() {
    const blackCard = this.decks.black.pop();
    this.blackCard = blackCard;
  }

  generateHand() {
    return Array.apply(null, Array(7)).map(() => this.drawWhiteCard());
  }

  addPlayer(playerId, name) {
    if (!this.players) this.players = {};
    this.players[playerId] = {
      name,
      score: 0,
      isCardzar: false,
      submittedCard: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  recordCardSubmit(playerId) {
    this.players[playerId].submittedCard = true;
  }

  isRoundReady() {
    return Object.keys(this.players).every(
      (p) => this.players[p].submittedCard || this.players[p].isCardzar
    );
  }

  setRandomCardzar() {
    const playerKeys = Object.keys(this.players);
    const randomCardzarIndex = Math.floor(Math.random() * playerKeys.length);
    const cardzarPlayerId = playerKeys[randomCardzarIndex];
    this.players[cardzarPlayerId].isCardzar = true;
  }

  async getAllPlayers() {
    const playerIds = Object.keys(this.players);
    return await Promise.all(
      playerIds.map(async (pid) => {
        const snapshot = await this._db.ref(`players/${pid}`).once("value");
        return {
          ...snapshot.val(),
          playerId: pid,
        };
      })
    );
  }

  async getAllPlayersCards() {
    const players = await this.getAllPlayers();

    return players
      .filter((p) => !this.players[p.playerId].isCardzar)
      .map((p) => p.submittedCard);
  }

  updatePlayerTime(playerId) {
    this.players[playerId].lastUpdated = new Date().toISOString();
  }

  async recordRoundWinner(cardId) {
    const players = await this.getAllPlayers();
    const winner = players.find(
      (p) => p.submittedCard && p.submittedCard.id === cardId
    );

    const roundWinner = this.players[winner.playerId];
    roundWinner.score++;
    this.round.winner = this.players[winner.playerId];
    this.round.winningCard = winner.submittedCard;
    this.round.isComplete = true;

    if (parseInt(this.winner.winningScore) === roundWinner.score) {
      this.winner.winner = roundWinner;
      this.gameOver = true;
    }
  }

  resetRound() {
    this.round = {
      ready: false,
      cards: [],
      winner: {},
      winningCard: {},
      isComplete: false,
    };

    const playerIds = Object.keys(this.players);
    playerIds.forEach((pid) => {
      this.players[pid].submittedCard = false;
    });
  }

  setNextCardzar() {
    const playerIds = Object.keys(this.players);
    const currentCardzarId = playerIds.find(
      (pid) => this.players[pid].isCardzar
    );
    const currentCardzarIndex = playerIds.indexOf(currentCardzarId);

    this.players[currentCardzarId].isCardzar = false;

    const nextCardzarIndex =
      currentCardzarIndex >= playerIds.length - 1 ? 0 : currentCardzarIndex + 1;
    const cardzarId = playerIds[nextCardzarIndex];

    this.players[cardzarId].isCardzar = true;
  }

  resetGame() {
    const playerIds = Object.keys(this.players);

    playerIds.forEach((pid) => {
      this.players[pid].score = 0;
      this.players[pid].isCardzar = false;
      this.players[pid].submittedCard = false;
      this.players[pid].lastUpdated = new Date();
    });

    const resetBody = generateNewGameBody(
      this.expansion,
      this.winner.winningScore,
      true
    );
    Object.keys(resetBody).forEach((key) => {
      this[key] = resetBody[key];
    });
  }
}

module.exports = Game;
