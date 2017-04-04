const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// create a schema
const imageSchema = new mongoose.Schema({
  name: String,
  guid: String,
  data: String
});

// create the model
const imageModel = mongoose.model('Image', imageSchema);

// export the model
module.exports = imageModel;