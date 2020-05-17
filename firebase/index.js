const admin = require("firebase-admin");
const serviceAccount = require("../../firebaseToken");
const { databaseURL } = process.env;
const { Game, Player } = require("../classes");
const { generateGameCode } = require("../utils");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
});

const db = admin.database();

const crud = {
  create: async (collection, data, setWithGameCode = false) => {
    if (setWithGameCode) {
      const gameCode = generateGameCode();
      await db.ref(collection).child(gameCode).set(data);
      return gameCode;
    } else {
      const response = await db.ref(collection).push(data);
      return response.path.pieces_[1];
    }
  },
  read: async (type, ref) => {
    const data = (await db.ref(ref).once("value")).val();
    return type === "player"
      ? new Player(data, db, ref)
      : new Game(data, db, ref);
  },
  update: (ref, update) => {
    return Promise.all(
      Object.keys(update).map((key) => {
        return db.ref(`${ref}/${key}`).set(update[key]);
      })
    );
  },
  delete: (id) => db.ref(id).remove(),
};
const firebase = {
  Players: {
    create: (data) => crud.create("players", data),
    read: (ref) => crud.read("player", `players/${ref}`),
    update: (ref, update) => crud.update(`players/${ref}`, update),
    delete: (ref) => crud.delete(`players/${ref}`),
  },
  Games: {
    create: (data) => crud.create("games", data, true),
    read: (ref) => crud.read("game", `games/${ref}`),
    update: (ref, update) => crud.update(`games/${ref}`, update),
    delete: (ref) => crud.delete(`games/${ref}`),
  },
};

module.exports = firebase;
