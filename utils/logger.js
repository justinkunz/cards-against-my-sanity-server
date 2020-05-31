const logger = (...events) => {
  console.log(...events);
  return (...subEvent) => logger(...events, "::", ...subEvent);
};

const loggerBuilder = (title) => {
  const fn = (...events) => logger("-->", title, "::", ...events);
  fn.error = (...subEvents) =>
    logger("-->", title, ":: ERROR ::", ...subEvents);
  fn.subLog = (subtitle) => loggerBuilder(`${title} :: ${subtitle}`);
  return fn;
};

module.exports = loggerBuilder;
