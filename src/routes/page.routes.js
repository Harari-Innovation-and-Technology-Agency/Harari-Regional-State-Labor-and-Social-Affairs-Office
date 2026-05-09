const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pagesController = require('../controllers/page.controller');
const { auth, adminAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // You need this

// Validation rules
const pageValidation = [
  body('heroTitle').optional().trim(),
  body('vision').optional().trim(),
  body('mission').optional().trim(),
  body('values').optional(),
  body('responsibilities').optional().trim(),
  body('metaTitle').optional().trim(),
  body('metaDescription').optional().trim(),
  body('isPublished').optional().isBoolean()
];

// Public routes
router.get('/:pageType', pagesController.getPage);

// Protected routes (admin)
router.put('/:pageType', adminAuth, pageValidation, pagesController.updatePage);
router.get('/', adminAuth, pagesController.getAllPages);

// Hero image upload
router.post(
  '/:pageType/image',
  adminAuth,
  upload.single('image'),
  pagesController.uploadHeroImage
);

// Version history
router.get('/:pageType/history', adminAuth, pagesController.getVersionHistory);
router.post('/:pageType/restore/:version', adminAuth, pagesController.restoreVersion);

module.exports = router;