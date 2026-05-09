const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const galleryController = require('../controllers/gallery.controller');
const upload = require('../middleware/upload.middleware');
const { auth, adminAuth } = require('../middleware/auth.middleware');

// Validation rules
const galleryValidation = [
  body('caption').optional(),
  body('category').isIn(['Meeting', 'Activities', 'Regional Landscape']).withMessage('Invalid category'),
  body('alt').optional()
];

// Public routes
router.get('/', galleryController.getGallery);
router.get('/categories', galleryController.getGalleryByCategories);

// Protected routes (admin)
router.post('/', 
  auth,
  adminAuth, 
  upload.single('image'),
  galleryValidation,
  galleryController.uploadImage
);
router.put('/:id', auth,adminAuth, galleryValidation, galleryController.updateImage);
router.delete('/:id', auth,adminAuth, galleryController.deleteImage);

module.exports = router;