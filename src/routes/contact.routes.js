const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const contactController = require('../controllers/contact.controller');
const { auth, adminAuth } = require('../middleware/auth.middleware');

// Validation rules
const contactValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional(),
  body('subject').optional(),
  body('message').notEmpty().withMessage('Message is required')
];

// Public routes
router.post('/', contactValidation, contactController.submitContact);

// Protected routes (admin)
router.get('/', auth,adminAuth, contactController.getAllContacts);
router.get('/:id',auth, adminAuth, contactController.getContactById);
router.put('/:id',auth, adminAuth, contactController.updateContactStatus);
router.delete('/:id',auth, adminAuth, contactController.deleteContact);

module.exports = router;