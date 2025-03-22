const express = require('express');
const router = express.Router();
const {
  createBudgetEntry,
  getBudgetEntries,
  getBudgetEntryById,
  updateBudgetEntry,
  deleteBudgetEntry,
  searchBudgetEntries,
  getBudgetStats,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .post(createBudgetEntry)
  .get(getBudgetEntries);

router.route('/search')
  .get(searchBudgetEntries);

router.route('/stats')
  .get(getBudgetStats);

router.route('/:id')
  .get(getBudgetEntryById)
  .put(updateBudgetEntry)
  .delete(deleteBudgetEntry);

module.exports = router;
