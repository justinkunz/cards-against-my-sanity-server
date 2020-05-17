const fs = require("fs");

const getCombined = (cardType) => {
  const folderPrefix = "./data";
  const files = fs.readdirSync(`${folderPrefix}/${cardType}`);
  const combined = [].concat.apply(
    [],
    files.map((f) => require(`.${folderPrefix}/${cardType}/${f}`))
  );
  return combined;
};

const init = () => {
  const targetPath = "./data/combinedCards.json";
  const contents = {
    white: getCombined("white"),
    black: getCombined("black"),
  };
  fs.writeFileSync(targetPath, JSON.stringify(contents));
};

init();
