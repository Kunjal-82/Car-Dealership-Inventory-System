const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { inventoryId, quantityPurchased } = req.body;
    if (!inventoryId || !quantityPurchased) {
      return res.status(400).json({ message: 'InventoryId and quantityPurchased are required' });
    }

    if (quantityPurchased <= 0) {
      return res.status(400).json({ message: 'quantityPurchased must be greater than 0' });
    }

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (inventory.quantity < quantityPurchased) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    // Deduct stock
    inventory.quantity -= quantityPurchased;
    await inventory.save();

    const unitPrice = inventory.price;
    const totalPrice = unitPrice * quantityPurchased;

    const purchase = new Purchase({
      userId: req.user.id,
      inventoryId,
      quantityPurchased,
      unitPrice,
      totalPrice,
      status: 'completed'
    });

    await purchase.save();
    res.status(201).json(purchase);
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    const purchases = await Purchase.find(query)
      .populate({
        path: 'inventoryId',
        populate: {
          path: 'vehicleId'
        }
      })
      .populate('userId', 'name email role');

    res.json(purchases);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
