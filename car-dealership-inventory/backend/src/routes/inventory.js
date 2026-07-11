const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/', authenticateToken, requireRole(['admin']), inventoryController.createInventory);
router.get('/', inventoryController.getInventory);
router.put('/:id', authenticateToken, requireRole(['admin']), inventoryController.updateInventory);

module.exports = router;
