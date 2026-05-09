const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { auth, adminAuth } = require('../middleware/auth.middleware');
const { superAdminOnly, canManageUsers } = require('../middleware/role.middleware');

// Validation rules
const userValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'super_admin'])
    .withMessage('Invalid role')
];

// Profile routes (authenticated users)
router.get('/profile/me', auth, userController.getMyProfile);
router.put('/profile/me', auth, userController.updateMyProfile);

// Admin only routes
router.get('/', auth, superAdminOnly, userController.getAllUsers);
router.get('/:id', auth,superAdminOnly, userController.getUserById);
router.post('/', 
  auth, 
  adminAuth, 
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').notEmpty().withMessage('Email is required').isEmail(),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }),
    body('role').optional().isIn(['admin', 'editor', 'viewer'])
  ], 
  userController.createUser
);
router.put('/:id', auth, superAdminOnly,userValidation, userController.updateUser);
router.delete('/:id', auth,superAdminOnly, userController.deleteUser);

module.exports = router;