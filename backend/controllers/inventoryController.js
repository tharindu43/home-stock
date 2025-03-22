const Inventory = require('../models/Inventory');

// @desc    Create a new inventory item
// @route   POST /api/inventory
// @access  Private
const createInventoryItem = async (req, res) => {
  try {
    const { 
      name, 
      category, 
      location, 
      description, 
      value, 
      purchaseDate, 
      warranty, 
      serialNumber, 
      condition, 
      notes, 
      image 
    } = req.body;

    const inventoryItem = await Inventory.create({
      user: req.user._id,
      name,
      category,
      location,
      description,
      value,
      purchaseDate: purchaseDate || Date.now(),
      warranty,
      serialNumber,
      condition,
      notes,
      image: image || '',
    });

    res.status(201).json(inventoryItem);
  } catch (error) {
    console.error('Error in createInventoryItem:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all inventory items for a user
// @route   GET /api/inventory
// @access  Private
const getInventoryItems = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(inventoryItems);
  } catch (error) {
    console.error('Error in getInventoryItems:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get an inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryItemById = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id);

    // Check if inventory item exists and belongs to user
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (inventoryItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this inventory item' });
    }

    res.json(inventoryItem);
  } catch (error) {
    console.error('Error in getInventoryItemById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventoryItem = async (req, res) => {
  try {
    const { name, category, location, description, value, purchaseDate, warranty, serialNumber, condition, notes, image } = req.body;

    const inventoryItem = await Inventory.findById(req.params.id);

    // Check if inventory item exists and belongs to user
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (inventoryItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this inventory item' });
    }

    // Update inventory item fields
    inventoryItem.name = name || inventoryItem.name;
    inventoryItem.category = category || inventoryItem.category;
    inventoryItem.location = location || inventoryItem.location;
    inventoryItem.description = description || inventoryItem.description;
    inventoryItem.value = value !== undefined ? value : inventoryItem.value;
    inventoryItem.purchaseDate = purchaseDate || inventoryItem.purchaseDate;
    inventoryItem.warranty = warranty || inventoryItem.warranty;
    inventoryItem.serialNumber = serialNumber || inventoryItem.serialNumber;
    inventoryItem.condition = condition || inventoryItem.condition;
    inventoryItem.notes = notes !== undefined ? notes : inventoryItem.notes;
    inventoryItem.image = image !== undefined ? image : inventoryItem.image;

    const updatedInventoryItem = await inventoryItem.save();
    res.json(updatedInventoryItem);
  } catch (error) {
    console.error('Error in updateInventoryItem:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
const deleteInventoryItem = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id);

    // Check if inventory item exists and belongs to user
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (inventoryItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this inventory item' });
    }

    await inventoryItem.deleteOne();
    res.json({ message: 'Inventory item removed' });
  } catch (error) {
    console.error('Error in deleteInventoryItem:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search inventory items
// @route   GET /api/inventory/search
// @access  Private
const searchInventoryItems = async (req, res) => {
  try {
    const { query, category, location, sortBy, order } = req.query;
    
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
    
    // Add location filter if provided
    if (location) {
      searchCriteria.location = location;
    }
    
    // Build sort options
    let sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions = { createdAt: -1 }; // Default sort by creation date
    }
    
    const inventoryItems = await Inventory.find(searchCriteria).sort(sortOptions);
    
    res.json(inventoryItems);
  } catch (error) {
    console.error('Error in searchInventoryItems:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private
const getInventoryStats = async (req, res) => {
  try {
    // Total count
    const totalCount = await Inventory.countDocuments({ user: req.user._id });
    
    // Count by category
    const categoryStats = await Inventory.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count by location
    const locationStats = await Inventory.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Total value
    const valueStats = await Inventory.aggregate([
      { $match: { user: req.user._id } },
      { $group: { 
          _id: null, 
          totalValue: { $sum: '$value' },
          averagePrice: { $avg: '$value' }
        } 
      }
    ]);
    
    res.json({
      totalCount,
      categoryStats,
      locationStats,
      valueStats: valueStats[0] || { totalValue: 0, averagePrice: 0 },
    });
  } catch (error) {
    console.error('Error in getInventoryStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  searchInventoryItems,
  getInventoryStats,
};
