const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  pageType: {
    type: String,
    enum: ['about', 'home', 'contact', 'faq', 'terms'],
    required: true,
    unique: true
  },
  
  // Hero Section
  heroTitle: {
    type: String,
    default: ''
  },
  heroImage: {
    type: String,
    default: ''
  },
  
  // Main Content
  vision: {
    type: String,
    default: ''
  },
  mission: {
    type: String,
    default: ''
  },
  
  // Core Values - Now an Array
  values: [{
    type: String,
    default: []
  }],
  
  responsibilities: {
    type: String,
    default: ''
  },
  
  // SEO
  metaTitle: {
    type: String,
    default: ''
  },
  metaDescription: {
    type: String,
    default: ''
  },
  
  // Publishing
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  
  // Translations
  translations: {
    am: {
      heroTitle: String,
      vision: String,
      mission: String,
      values: [String],
      responsibilities: String,
      metaTitle: String,
      metaDescription: String
    },
    om: {
      heroTitle: String,
      vision: String,
      mission: String,
      values: [String],
      responsibilities: String,
      metaTitle: String,
      metaDescription: String
    }
  },
  
  // Version History
  versionHistory: [{
    version: Number,
    data: Object,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
  
}, {
  timestamps: true 
});

module.exports = mongoose.model('Page', pageSchema);