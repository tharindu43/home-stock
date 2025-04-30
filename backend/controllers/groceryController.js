const Grocery = require('../models/Grocery');
const { checkExpiringGroceries } = require('../services/notificationService');

// @desc    Create a new grocery item
// @route   POST /api/groceries
// @access  Private
const createGrocery = async (req, res) => {
  try {
    const { name, category, quantity, unit, purchaseDate, expiryDate, notes } = req.body;



    
    const grocery = await Grocery.create({
      user: req.user._id,
      name,
      category,
      quantity,
      unit,
      purchaseDate: purchaseDate || Date.now(),
      expiryDate,
      notes,
    });
    // Trigger notification check for expired/expiring items
    checkExpiringGroceries().catch(err => console.error('Notification check error:', err));
    res.status(201).json(grocery);
  } catch (error) {
    console.error('Error in createGrocery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all grocery items for a user
// @route   GET /api/groceries
// @access  Private
const getGroceries = async (req, res) => {
  try {
    const groceries = await Grocery.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(groceries);
  } catch (error) {
    console.error('Error in getGroceries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a grocery item by ID
// @route   GET /api/groceries/:id
// @access  Private
const getGroceryById = async (req, res) => {
  try {
    const grocery = await Grocery.findById(req.params.id);

    // Check if grocery exists and belongs to user
    if (!grocery) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    if (grocery.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this grocery item' });
    }

    res.json(grocery);
  } catch (error) {
    console.error('Error in getGroceryById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a grocery item
// @route   PUT /api/groceries/:id
// @access  Private
const updateGrocery = async (req, res) => {
  try {
    const { name, category, quantity, unit, purchaseDate, expiryDate, notes } = req.body;

    const grocery = await Grocery.findById(req.params.id);

    // Check if grocery exists and belongs to user
    if (!grocery) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    if (grocery.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this grocery item' });
    }

    // Update grocery fields
    grocery.name = name || grocery.name;
    grocery.category = category || grocery.category;
    grocery.quantity = quantity !== undefined ? quantity : grocery.quantity;
    grocery.unit = unit || grocery.unit;
    grocery.purchaseDate = purchaseDate || grocery.purchaseDate;
    grocery.expiryDate = expiryDate || grocery.expiryDate;
    grocery.notes = notes !== undefined ? notes : grocery.notes;

    // If expiry date has changed, reset notification status
    if (expiryDate && new Date(expiryDate).getTime() !== new Date(grocery.expiryDate).getTime()) {
      grocery.notificationSent = false;
    }

    const updatedGrocery = await grocery.save();
    res.json(updatedGrocery);
  } catch (error) {
    console.error('Error in updateGrocery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a grocery item
// @route   DELETE /api/groceries/:id
// @access  Private
const deleteGrocery = async (req, res) => {
  try {
    const grocery = await Grocery.findById(req.params.id);

    // Check if grocery exists and belongs to user
    if (!grocery) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    if (grocery.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this grocery item' });
    }

    await grocery.deleteOne();
    res.json({ message: 'Grocery item removed' });
  } catch (error) {
    console.error('Error in deleteGrocery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search grocery items
// @route   GET /api/groceries/search
// @access  Private
const searchGroceries = async (req, res) => {
  try {
    const { query, category, sortBy, order } = req.query;
    
    // Build search criteria
    const searchCriteria = { user: req.user._id };
    
    // Add text search if query provided
    if (query) {
      searchCriteria.$text = { $search: query };
    }
    
    // Add category filter if provided
    if (category) {
      searchCriteria.category = category;
    }
    
    // Build sort options
    let sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions = { createdAt: -1 }; // Default sort by creation date
    }
    
    const groceries = await Grocery.find(searchCriteria).sort(sortOptions);
    
    res.json(groceries);
  } catch (error) {
    console.error('Error in searchGroceries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get expiring groceries (within 7 days)
// @route   GET /api/groceries/expiring
// @access  Private
const getExpiringGroceries = async (req, res) => {
  try {
    // Get current date and date 7 days from now
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    
    const expiringGroceries = await Grocery.find({
      user: req.user._id,
      expiryDate: { $gte: today, $lte: sevenDaysLater },
    }).sort({ expiryDate: 1 });
    
    res.json(expiringGroceries);
  } catch (error) {
    console.error('Error in getExpiringGroceries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get grocery statistics
// @route   GET /api/groceries/stats
// @access  Private
const getGroceryStats = async (req, res) => {
  try {
    // Total count
    const totalCount = await Grocery.countDocuments({ user: req.user._id });
    
    // Count by category
    const categoryStats = await Grocery.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Expiring soon count
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    
    const expiringCount = await Grocery.countDocuments({
      user: req.user._id,
      expiryDate: { $gte: today, $lte: sevenDaysLater },
    });
    
    // Expired count
    const expiredCount = await Grocery.countDocuments({
      user: req.user._id,
      expiryDate: { $lt: today },
    });
    
    res.json({
      totalCount,
      categoryStats,
      expiringCount,
      expiredCount,
    });
  } catch (error) {
    console.error('Error in getGroceryStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createGrocery,
  getGroceries,
  getGroceryById,
  updateGrocery,
  deleteGrocery,
  searchGroceries,
  getExpiringGroceries,
  getGroceryStats,
};
