const logger = require("../utils/logger")("DB");

class Firebase {
  constructor(data, db, ref) {
    Object.keys(data).forEach((key) => {
      this[key] = data[key];
    });
    this._db = db;
    this._ref = ref;
  }

  dbVals() {
    const vals = { ...this };

    delete vals._db;
    delete vals._ref;

    Object.keys(vals).forEach((key) => {
      if (typeof vals[key] === "function") {
        delete vals[key];
      }
    });
    return vals;
  }
  async save() {
    logger(`Updating values for ${this._ref}`);
    const vals = this.dbVals();
    await this._db.ref(this._ref).set({ ...vals, lastUpdated: new Date() });
  }
}

module.exports = Firebase;
