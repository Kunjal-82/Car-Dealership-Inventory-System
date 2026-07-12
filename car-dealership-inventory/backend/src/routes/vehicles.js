const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const purchaseController = require('../controllers/purchaseController');
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/', authenticateToken, requireRole(['admin']), vehicleController.createVehicle);
router.get('/', vehicleController.getVehicles);
router.get('/search', vehicleController.searchVehicles);
router.put('/:id', authenticateToken, requireRole(['admin']), vehicleController.updateVehicle);
router.delete('/:id', authenticateToken, requireRole(['admin']), vehicleController.deleteVehicle);

// Inventory operations
router.post('/:id/purchase', authenticateToken, purchaseController.createPurchase);
router.post('/:id/restock', authenticateToken, requireRole(['admin']), inventoryController.restockVehicle);

module.exports = router;
