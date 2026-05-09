const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  cover: {
    type: String,
    default: ''
  },

  summary: {
    type: String
  },

  content: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: ['News', 'Announcement', 'Event', 'Meeting'],
    default: 'News'
  },

  status: {
    type: String,
    enum: ['Draft', 'Under Review', 'Published'],
    default: 'Draft'
  },

  views: {
    type: Number,
    default: 0
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });


// 🔥 DEBUG VERSION OF PRE SAVE
newsSchema.pre('save', function () {
  console.log("=== PRE SAVE TRIGGERED ===");

  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  this.updatedAt = Date.now();
});


module.exports = mongoose.model('News', newsSchema);
