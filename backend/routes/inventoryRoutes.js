const express = require('express');
const router = express.Router();
const {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  searchInventoryItems,
  getInventoryStats,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .post(createInventoryItem)
  .get(getInventoryItems);

router.route('/search')
  .get(searchInventoryItems);

router.route('/stats')
  .get(getInventoryStats);

router.route('/:id')
  .get(getInventoryItemById)
  .put(updateInventoryItem)
  .delete(deleteInventoryItem);

module.exports = router;
