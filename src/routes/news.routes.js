const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const newsController = require('../controllers/news.controller');
const { auth, adminAuth } = require('../middleware/auth.middleware');

/* ===============================
   MULTER CONFIG
=================================*/
const upload = require('../config/upload');


/* ===============================
   VALIDATION
=================================*/
const newsValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Body content is required'),
  body('category').isIn(['News', 'Announcement', 'Event', 'Meeting']),
  body('status')
    .optional()
    .isIn(['Draft', 'Under Review', 'Published'])
];

/* ===============================
   PUBLIC ROUTES
=================================*/
router.get('/', newsController.getAllNews);
router.get('/slug/:slug', newsController.getNewsBySlug);

/* ===============================
   ADMIN ROUTES
=================================*/
router.get('/admin/all', auth, adminAuth, newsController.getAllAdminNews);

router.post(
  '/',
  auth,
  adminAuth,
  upload.single('cover'),
  newsValidation,
  newsController.createNews
);

router.put(
  '/:id',
  auth,
  adminAuth,
  upload.single('cover'),
  newsValidation,
  newsController.updateNews
);

router.delete(
  '/:id',
  auth,
  adminAuth,
  newsController.deleteNews
);

router.get(
  '/admin/:id',
  auth,
  adminAuth,
  newsController.getNewsById
);

module.exports = router;
