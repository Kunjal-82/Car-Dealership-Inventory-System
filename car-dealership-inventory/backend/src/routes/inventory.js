const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Vehicle = require('../models/Vehicle');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { vehicleId, color, quantity, price } = req.body;
    if (!vehicleId || !color || quantity === undefined || price === undefined) {
      return res.status(400).json({ message: 'VehicleId, color, quantity, and price are required' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(400).json({ message: 'Invalid vehicleId' });
    }

    const inventory = new Inventory({ vehicleId, color, quantity, price });
    await inventory.save();
    res.status(201).json(inventory);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    let query = {};
    if (vehicleId) {
      query.vehicleId = vehicleId;
    }
    const inventory = await Inventory.find(query).populate('vehicleId');
    res.json(inventory);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { quantity, price, color } = req.body;
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    if (quantity !== undefined) inventory.quantity = quantity;
    if (price !== undefined) inventory.price = price;
    if (color !== undefined) inventory.color = color;

    await inventory.save();
    res.json(inventory);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
