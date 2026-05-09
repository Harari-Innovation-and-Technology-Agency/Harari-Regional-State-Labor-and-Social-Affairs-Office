const Service = require('../models/Service.model');
const { validationResult } = require('express-validator');

/**
 * =========================================
 * ADMIN: Get ALL services (no filtering)
 * =========================================
 */
exports.getAllServicesAdmin = async (req, res) => {
  try {
    const services = await Service.find({})
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json(services);
  } catch (error) {
    console.error('Admin get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * =========================================
 * PUBLIC: Get only AVAILABLE services
 * =========================================
 */
exports.getAvailableServices = async (req, res) => {
  try {

    const available = await Service.find({ status: "Available" });

    res.json(available);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create service (admin)
exports.createService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, status } = req.body;

    const service = new Service({
      title,
      description,
      category,
      isActive: status === 'Available'
    });

    await service.save();

    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Update service (admin)
exports.updateService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, category, status } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.title = title;
    service.description = description;
    service.category = category;
    service.isActive = status === 'Available';

    await service.save();

    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Delete service (admin)
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await service.deleteOne();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
