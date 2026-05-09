const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: [ 'plan', 'report'],
    required: true
  },

  year: Number,

  fileUrl: {
    type: String,
    required: true
  },

  fileName: String,
  fileSize: Number,
  mimeType: String,

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
