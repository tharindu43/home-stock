const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Inventory item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Storage location is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    value: {
      type: Number,
      required: [true, 'Value is required'],
      min: [0, 'Value cannot be negative'],
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    warranty: {
      type: Date,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
      default: 'Good',
    },
    notes: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient searching
inventorySchema.index({ name: 'text', category: 'text', location: 'text', notes: 'text' });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
