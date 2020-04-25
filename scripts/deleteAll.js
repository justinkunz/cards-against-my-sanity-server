require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("../firebase/firebaseToken");
const { databaseURL } = process.env;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
});

const db = admin.database();

const init = () => {
  db.ref().once("value", async (snapshot) => {
    const keys = Object.keys(snapshot.val());
    await Promise.all(keys.map((k) => db.ref(k).remove()));
    console.log("Done.");
  });
};

init();
