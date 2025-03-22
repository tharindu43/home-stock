const express = require('express');
const router = express.Router();
const {
  createGrocery,
  getGroceries,
  getGroceryById,
  updateGrocery,
  deleteGrocery,
  searchGroceries,
  getExpiringGroceries,
  getGroceryStats,
} = require('../controllers/groceryController');
const { protect } = require('../middleware/authMiddleware');
const { checkExpiringGroceries } = require('../services/notificationService');

// All routes are protected
router.use(protect);

router.route('/')
  .post(createGrocery)
  .get(getGroceries);

router.route('/search')
  .get(searchGroceries);

router.route('/expiring')
  .get(getExpiringGroceries);

router.route('/stats')
  .get(getGroceryStats);

router.route('/check-expiry')
  .get(async (req, res) => {
    try {
      const result = await checkExpiringGroceries();
      res.json(result);
    } catch (error) {
      console.error('Error in manual expiry check:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

router.route('/:id')
  .get(getGroceryById)
  .put(updateGrocery)
  .delete(deleteGrocery);

module.exports = router;
