const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// create a schema
const pageSchema = new mongoose.Schema({
  content: String
});

// create the model
const pageModel = mongoose.model('Page', pageSchema);

// export the model
module.exports = pageModel;