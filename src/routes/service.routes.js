const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const servicesController = require('../controllers/service.controller');
const { auth, adminAuth } = require('../middleware/auth.middleware');

/**
 * Validation
 */
const serviceValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category')
    .isIn([
      'Social Protection',
      'Employment',
      'Disability Support',
      'Labor Relations',
      'Community Development'
    ])
    .withMessage('Invalid category'),
  body('status')
    .isIn(['Available', 'Suspended'])
    .withMessage('Status must be Available or Suspended')
];

/**
 * =========================================
 * PUBLIC ROUTES
 * =========================================
 */

// Public → Only available services
router.get('/', servicesController.getAvailableServices);


/**
 * =========================================
 * ADMIN ROUTES
 * =========================================
 */

// Admin → Get ALL services
router.get('/admin', auth, adminAuth, servicesController.getAllServicesAdmin);

// Create
router.post('/', auth, adminAuth, serviceValidation, servicesController.createService);

// Update
router.put('/:id', auth, adminAuth, serviceValidation, servicesController.updateService);

// Delete
router.delete('/:id', auth, adminAuth, servicesController.deleteService);

module.exports = router;
