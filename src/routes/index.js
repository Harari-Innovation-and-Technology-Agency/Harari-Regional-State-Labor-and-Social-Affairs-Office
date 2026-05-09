const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const newsRoutes = require('./news.routes');
const galleryRoutes = require('./gallery.routes');
const serviceRoutes = require('./service.routes');
const pageRoutes = require('./page.routes');
const contactRoutes = require('./contact.routes');

router.use('/auth', authRoutes);
router.use('/news', newsRoutes);
router.use('/gallery', galleryRoutes);
router.use('/services', serviceRoutes);
router.use('/pages', pageRoutes);
router.use('/contact', contactRoutes);

module.exports = router;