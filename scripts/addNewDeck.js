const fs = require("fs");

const uuid = (len) => {
  const options =
    "QWERTYUIOPLKJHGFDSAZXCVBNMqwertyuioplkjhgfdsazxcvbnm0987654321";
  return Array.apply(null, Array(len))
    .map(() => options[Math.floor(Math.random() * options.length)])
    .join("");
};

const getCardsFromFile = (filePath, deck, color) => {
  const idPrefix = color.toLowerCase() === "white" ? "wh" : "bl";
  const fileContents = fs.readFileSync(filePath, "utf-8");
  const cards = fileContents
    .split("\n")
    .map((c) => c.replace(/_/g, "______"))
    .filter((c) => !!c)
    .map((card) => ({
      text: card,
      id: `${idPrefix}-${uuid(12)}`,
      deck,
    }));

  fs.writeFileSync(
    `./data/${color.toLowerCase()}/ua-${deck.toLowerCase()}.json`,
    JSON.stringify(cards)
  );
};

const [, , filePath, deck, color] = process.argv;

if (!filePath || !deck || !color)
  throw "Must use npm run addDeck <filepath> <deck> <color>";

getCardsFromFile(filePath, deck, color);
