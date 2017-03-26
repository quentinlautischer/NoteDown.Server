const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// create a schema
const imageSchema = new mongoose.Schema();

// create the model
const imageModel = mongoose.model('Image', imageSchema);

// export the model
module.exports = imageModel;