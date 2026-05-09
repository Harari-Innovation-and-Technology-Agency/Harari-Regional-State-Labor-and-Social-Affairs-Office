const router = require('express').Router();
const upload = require('../config/upload');
const controller = require('../controllers/plan.controller');
const {auth,adminAuth} = require('../middleware/auth.middleware');

// Upload
router.post(
  '/upload',
  auth,
  adminAuth,
  upload.single('file'),
  controller.uploadDocument
);

// Get All
router.get('/admin',auth,adminAuth, controller.getDocuments);

// Delete
router.delete('/:id', auth,adminAuth, controller.deleteDocument);

router.get('/', controller.getPublicDocuments);
module.exports = router;
