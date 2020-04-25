const baseBlack = require("../data/black/Base.json");
const baseWhite = require("../data/white/Base.json");
const packs = require("../data/packs.json");
const { shuffle } = require("../utils");
const fs = require("fs");

class CardDeck {
  constructor(expansionPacks) {
    this.expansion = this.getExpansion(expansionPacks);
    this.cards = {
      black: baseBlack.concat(this.expansion.black),
      white: baseWhite.concat(this.expansion.white),
    };
    this.blackCards = shuffle(
      this.cards.black.map((c) => ({ id: c.id, text: c.text }))
    );
    this.whiteCards = shuffle(
      this.cards.white.map((c) => ({ id: c.id, text: c.text }))
    );
  }

  /**
   * Extract cards from selected expansion packs
   */
  getExpansion(expansionPacks) {
    const packNames = packs.map((p) => p.pack);

    let blackCards = [];
    let whiteCards = [];

    expansionPacks.forEach((ep) => {
      const packIndex = packNames.indexOf(ep);
      if (packIndex === -1) return [];
      const { file } = packs[packIndex];
      const black = JSON.parse(
        fs.readFileSync(`./data/black/${file}`, "utf-8")
      );
      const white = JSON.parse(
        fs.readFileSync(`./data/white/${file}`, "utf-8")
      );
      blackCards.push(black.map((c) => ({ id: c.id, text: c.text })));
      whiteCards.push(white.map((c) => ({ id: c.id, text: c.text })));
    });

    return {
      black: [].concat.apply([], blackCards),
      white: [].concat.apply([], whiteCards),
    };
  }
}

module.exports = CardDeck;
