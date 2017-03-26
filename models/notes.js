const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const FolderModel = require('./folder')
const ImageModel = require('./image')

// create a schema
const notesSchema = new mongoose.Schema({
  userid: { type: String, unique: true, index: true },
  folders: [FolderModel.schema],
  images: [ImageModel.schema]
});

// create the model
const notesModel = mongoose.model('Notes', notesSchema);

// export the model
module.exports = notesModel;