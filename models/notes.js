const mongoose = require('mongoose'),
  Schema = mongoose.Schema;
  
const FolderModel = require('./folder')


// create a schema
const notesSchema = new mongoose.Schema({
  userid: { type: String, unique: true, index: true },
  folders: [FolderModel.schema]
}, { timestamps: { createdAt: 'created_at' } });

// create the model
const notesModel = mongoose.model('Notes', notesSchema);

// export the model
module.exports = notesModel;