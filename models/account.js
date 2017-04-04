const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const NotesModel = require('./notes')

// create a schema
const accountSchema = new mongoose.Schema({
  email: {type: String, unique: true},
  name: String,
  password: String,
  notes: NotesModel.schema
}, { timestamps: { createdAt: 'created_at' } });

// create the model
const accountModel = mongoose.model('Account', accountSchema);

// export the model
module.exports = accountModel;