const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const ImageModel = require('./image')

// create a schema
const pageSchema = new mongoose.Schema({
  content: String,
  images: [ImageModel.schema]
});

// create the model
const pageModel = mongoose.model('Page', pageSchema);

// export the model
module.exports = pageModel;