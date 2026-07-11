const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { make, model, category, description } = req.body;
    if (!make || !model || !category) {
      return res.status(400).json({ message: 'Make, model, and category are required' });
    }

    const vehicle = new Vehicle({ make, model, category, description });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const vehicles = await Vehicle.find(query);
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { make, model, category, description } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (make) vehicle.make = make;
    if (model) vehicle.model = model;
    if (category) vehicle.category = category;
    if (description !== undefined) vehicle.description = description;

    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await Vehicle.deleteOne({ _id: req.params.id });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
