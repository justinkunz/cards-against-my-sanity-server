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
    delete vals.ref;

    Object.keys(vals).forEach((key) => {
      if (typeof vals[key] === "function") {
        delete vals[key];
      }
    });
    return vals;
  }
  async save() {
    const vals = this.dbVals();
    console.log("saving");
    await this._db.ref(this._ref).set({ ...vals, lastUpdated: new Date() });
  }
}

module.exports = Firebase;
