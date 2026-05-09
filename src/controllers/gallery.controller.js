const Gallery = require('../models/Gallery.model');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

// Get all gallery images
exports.getGallery = async (req, res) => {
  try {
    const { category, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (category) {
      query.category = category;
    }

    const images = await Gallery.find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'username')
      .select('-__v');

    const total = await Gallery.countDocuments(query);

    res.json({
      images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get gallery by categories
exports.getGalleryByCategories = async (req, res) => {
  try {
    const categories = ['Meeting', 'Activities', 'Regional Landscape'];
    const result = {};

    for (const category of categories) {
      const images = await Gallery.find({ category })
        .sort({ uploadedAt: -1 })
        .limit(12)
        .select('src caption alt category uploadedAt');
      
      result[category] = images;
    }

    res.json(result);
  } catch (error) {
    console.error('Get gallery by categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload image (admin)
exports.uploadImage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { caption, category, alt } = req.body;
    
    // Get image dimensions
    const size = fs.statSync(req.file.path).size;
    
    const imageUrl = `/uploads/images/${path.basename(req.file.path)}`;

    const galleryItem = new Gallery({
      src: imageUrl,
      caption: caption || '',
      category: category || 'Activities',
      alt: alt || caption || '',
      size,
      uploadedBy: req.user._id
    });

    await galleryItem.save();

    res.status(201).json(galleryItem);
  } catch (error) {
    console.error('Upload image error:', error);
    // Delete file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete image (admin)
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Gallery.findById(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', '..', image.src);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await image.deleteOne();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update image (admin)
exports.updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, category, alt, isFeatured, order } = req.body;

    const image = await Gallery.findById(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (caption !== undefined) image.caption = caption;
    if (category !== undefined) image.category = category;
    if (alt !== undefined) image.alt = alt;
    if (isFeatured !== undefined) image.isFeatured = isFeatured;
    if (order !== undefined) image.order = order;

    await image.save();

    res.json(image);
  } catch (error) {
    console.error('Update image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};