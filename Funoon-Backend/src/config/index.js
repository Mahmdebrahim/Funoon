const database = require('./database');
const moyasar = require('./moyasar');
const smartship = require('./smartship');

module.exports = {
  connectDB: database,
  moyasar,
  smartship,
};
