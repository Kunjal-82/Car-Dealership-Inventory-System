const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');

exports.createPurchase = async (req, res, next) => {
  try {
    const { color, inventoryId, quantityPurchased } = req.body;
    const vehicleId = req.params.id;

    if (!quantityPurchased || quantityPurchased <= 0) {
      return res.status(400).json({ message: 'quantityPurchased must be greater than 0' });
    }

    let inventory;
    if (inventoryId) {
      inventory = await Inventory.findById(inventoryId);
    } else if (color) {
      inventory = await Inventory.findOne({ vehicleId, color });
    } else {
      return res.status(400).json({ message: 'Either color or inventoryId is required' });
    }

    if (!inventory) {
      return res.status(404).json({ message: 'Matching inventory variant not found for this vehicle' });
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
      inventoryId: inventory._id,
      quantityPurchased,
      unitPrice,
      totalPrice
    });

    await purchase.save();
    res.status(201).json(purchase);
  } catch (err) {
    next(err);
  }
};

exports.getPurchases = async (req, res, next) => {
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
};
