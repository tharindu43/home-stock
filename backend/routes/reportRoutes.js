const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  generateGroceryReport,
  generateInventoryReport,
  generateBudgetReport,
  generateExpiringGroceriesReport,
  generateInventoryValueReport,
  generateMonthlyBudgetReport,
  generateAnnualBudgetReport,
  generateUserReport,
  downloadReport
} = require('../controllers/reportController');

// All routes are protected
router.use(protect);

// Basic reports
router.get('/groceries', generateGroceryReport);
router.get('/inventory', generateInventoryReport);
router.get('/budget', generateBudgetReport);

// New specialized reports
router.get('/expiring-groceries', generateExpiringGroceriesReport);
router.get('/inventory-value', generateInventoryValueReport);
router.get('/user', generateUserReport);
router.get('/monthly-budget', generateMonthlyBudgetReport);
router.get('/annual-budget', generateAnnualBudgetReport);
router.get('/users', generateUserReport);

// Download generated reports
router.get('/download/:filename', downloadReport);

module.exports = router;
