const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { auth, adminAuth } = require('../middleware/auth.middleware');

// Validation rules
const loginValidation = [
  body('username').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/login', loginValidation, authController.login);
router.post('/register',auth, adminAuth, registerValidation, authController.register);
router.get('/me', auth, authController.getCurrentUser);
router.post('/change-password', auth, authController.changePassword);
router.post('/logout', auth, authController.logout);

module.exports = router;