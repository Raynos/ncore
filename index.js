module.exports = process.env.NCORE_COV
  ? require('./lib-cov/core')
  : require('./lib/core')