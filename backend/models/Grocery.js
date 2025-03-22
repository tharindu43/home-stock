const mongoose = require('mongoose');

const grocerySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Grocery item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient searching
grocerySchema.index({ name: 'text', category: 'text', notes: 'text' });

// Virtual for checking if item is expiring soon (within 7 days)
grocerySchema.virtual('isExpiringSoon').get(function () {
  if (!this.expiryDate) return false;
  
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  const differenceInTime = expiryDate.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  return differenceInDays <= 7 && differenceInDays >= 0;
});

// Virtual for days until expiry
grocerySchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  const differenceInTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(differenceInTime / (1000 * 3600 * 24));
});

const Grocery = mongoose.model('Grocery', grocerySchema);

module.exports = Grocery;
