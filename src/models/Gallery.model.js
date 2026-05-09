const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  src: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Meeting', 'Activities', 'Regional Landscape'],
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    default: 0
  },
  height: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
});

gallerySchema.index({ category: 1 });
gallerySchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);