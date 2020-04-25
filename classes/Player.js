const Firebase = require("./Firebase");

class Player extends Firebase {
  constructor(data, db, ref) {
    super(data, db, ref);
  }

  getCardIndex(cardId) {
    return this.hand.map((c) => c.id).indexOf(cardId);
  }

  getCardById(cardId) {
    return this.hand[this.getCardIndex(cardId)];
  }

  replaceCard(cardId, newCard) {
    this.hand[this.getCardIndex(cardId)] = newCard;
  }

  reset(newHand) {
    this.isCardzar = false;
    this.score = 0;
    this.submittedCard = false;
    this.hand = newHand;
  }
}

module.exports = Player;
