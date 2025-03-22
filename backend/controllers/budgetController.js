const Budget = require('../models/Budget');

// @desc    Create a new budget entry
// @route   POST /api/budget
// @access  Private
const createBudgetEntry = async (req, res) => {
  try {
    const { type, category, description, amount, date, notes } = req.body;

    const budgetEntry = await Budget.create({
      user: req.user._id,
      type,
      category,
      description,
      amount,
      date: date || Date.now(),
      notes
    });

    res.status(201).json(budgetEntry);
  } catch (error) {
    console.error('Error in createBudgetEntry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all budget entries for a user
// @route   GET /api/budget
// @access  Private
const getBudgetEntries = async (req, res) => {
  try {
    const budgetEntries = await Budget.find({ user: req.user._id }).sort({ date: -1 });
    res.json(budgetEntries);
  } catch (error) {
    console.error('Error in getBudgetEntries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a budget entry by ID
// @route   GET /api/budget/:id
// @access  Private
const getBudgetEntryById = async (req, res) => {
  try {
    const budgetEntry = await Budget.findById(req.params.id);

    // Check if budget entry exists and belongs to user
    if (!budgetEntry) {
      return res.status(404).json({ message: 'Budget entry not found' });
    }

    if (budgetEntry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this budget entry' });
    }

    res.json(budgetEntry);
  } catch (error) {
    console.error('Error in getBudgetEntryById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a budget entry
// @route   PUT /api/budget/:id
// @access  Private
const updateBudgetEntry = async (req, res) => {
  try {
    const { type, category, description, amount, date, notes } = req.body;

    const budgetEntry = await Budget.findById(req.params.id);

    // Check if budget entry exists and belongs to user
    if (!budgetEntry) {
      return res.status(404).json({ message: 'Budget entry not found' });
    }

    if (budgetEntry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this budget entry' });
    }

    // Update budget entry fields
    budgetEntry.type = type || budgetEntry.type;
    budgetEntry.category = category || budgetEntry.category;
    budgetEntry.description = description !== undefined ? description : budgetEntry.description;
    budgetEntry.amount = amount !== undefined ? amount : budgetEntry.amount;
    budgetEntry.date = date || budgetEntry.date;
    budgetEntry.notes = notes !== undefined ? notes : budgetEntry.notes;

    const updatedBudgetEntry = await budgetEntry.save();
    res.json(updatedBudgetEntry);
  } catch (error) {
    console.error('Error in updateBudgetEntry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a budget entry
// @route   DELETE /api/budget/:id
// @access  Private
const deleteBudgetEntry = async (req, res) => {
  try {
    const budgetEntry = await Budget.findById(req.params.id);

    // Check if budget entry exists and belongs to user
    if (!budgetEntry) {
      return res.status(404).json({ message: 'Budget entry not found' });
    }

    if (budgetEntry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this budget entry' });
    }

    await budgetEntry.deleteOne();
    res.json({ message: 'Budget entry removed' });
  } catch (error) {
    console.error('Error in deleteBudgetEntry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search budget entries
// @route   GET /api/budget/search
// @access  Private
const searchBudgetEntries = async (req, res) => {
  try {
    const { query, type, category, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder } = req.query;
    
    // Build search filter
    const filter = { user: req.user._id };
    
    // Text search
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Type filter
    if (type) {
      filter.type = type;
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) {
        filter.amount.$gte = Number(minAmount);
      }
      if (maxAmount) {
        filter.amount.$lte = Number(maxAmount);
      }
    }
    
    // Build sort options
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.date = -1; // Default sort by date descending
    }
    
    const budgetEntries = await Budget.find(filter).sort(sort);
    
    res.json(budgetEntries);
  } catch (error) {
    console.error('Error in searchBudgetEntries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get budget statistics
// @route   GET /api/budget/stats
// @access  Private
const getBudgetStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date range filter
    const dateFilter = {};
    
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    // Build match criteria
    const matchCriteria = { user: req.user._id };
    
    if (Object.keys(dateFilter).length > 0) {
      matchCriteria.date = dateFilter;
    }
    
    // Calculate total income
    const incomeStats = await Budget.aggregate([
      { 
        $match: { 
          ...matchCriteria,
          type: 'income'
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    // Calculate total expenses
    const expenseStats = await Budget.aggregate([
      { 
        $match: { 
          ...matchCriteria,
          type: 'expense'
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    // Calculate expenses by category
    const expensesByCategory = await Budget.aggregate([
      { 
        $match: { 
          ...matchCriteria,
          type: 'expense'
        } 
      },
      { 
        $group: { 
          _id: '$category', 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      },
      { $sort: { total: -1 } }
    ]);
    
    // Calculate income by category
    const incomeByCategory = await Budget.aggregate([
      { 
        $match: { 
          ...matchCriteria,
          type: 'income'
        } 
      },
      { 
        $group: { 
          _id: '$category', 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      },
      { $sort: { total: -1 } }
    ]);
    
    // Get monthly summary for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlySummary = await Budget.aggregate([
      { 
        $match: { 
          user: req.user._id,
          date: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      income: incomeStats[0] || { total: 0, count: 0 },
      expense: expenseStats[0] || { total: 0, count: 0 },
      balance: (incomeStats[0]?.total || 0) - (expenseStats[0]?.total || 0),
      expensesByCategory,
      incomeByCategory,
      monthlySummary,
    });
  } catch (error) {
    console.error('Error in getBudgetStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBudgetEntry,
  getBudgetEntries,
  getBudgetEntryById,
  updateBudgetEntry,
  deleteBudgetEntry,
  searchBudgetEntries,
  getBudgetStats,
};
