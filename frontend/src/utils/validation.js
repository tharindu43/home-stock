// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Phone number validation (Sri Lankan format)
export const isValidPhoneNumber = (phoneNumber) => {
  // Allow empty phone numbers (optional field)
  if (!phoneNumber) return true;
  
  // Sri Lankan phone numbers must be 10 digits starting with 0
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

// Format phone number for display
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // If it starts with 0, it's already in the correct format
  if (phoneNumber.startsWith('0')) {
    return phoneNumber;
  }
  
  // If it starts with +94, convert to 0 format
  if (phoneNumber.startsWith('+94')) {
    return `0${phoneNumber.substring(3)}`;
  }
  
  // If it starts with 94, convert to 0 format
  if (phoneNumber.startsWith('94')) {
    return `0${phoneNumber.substring(2)}`;
  }
  
  return phoneNumber;
};

// Format phone number for API/storage (add country code)
export const formatPhoneNumberForStorage = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // If it starts with 0, convert to +94 format
  if (phoneNumber.startsWith('0')) {
    return `+94${phoneNumber.substring(1)}`;
  }
  
  // If it already has a + prefix, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  return phoneNumber;
};

// Password strength validation
export const isStrongPassword = (password) => {
  // At least 6 characters, with at least one uppercase, one lowercase, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

// User validation
export const validateUser = (userData, isEditMode = false) => {
  const errors = {};

  // Name validation
  if (!userData.name || userData.name.trim() === '') {
    errors.name = 'Name is required';
  } else if (userData.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // Email validation
  if (!userData.email || userData.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!isValidEmail(userData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone number validation
  if (userData.phoneNumber) {
    if (!isValidPhoneNumber(userData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number starting with 0';
    }
  } else {
    errors.phoneNumber = 'Phone number is required';
  }

  // Password validation (not required for edit mode unless provided)
  if (!isEditMode) {
    if (!userData.password) {
      errors.password = 'Password is required';
    } else if (!isStrongPassword(userData.password)) {
      errors.password = 'Password must be at least 6 characters with uppercase, lowercase, and numbers';
    }

    if (!userData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  } else if (userData.password) {
    // In edit mode, validate password only if provided
    if (!isStrongPassword(userData.password)) {
      errors.password = 'Password must be at least 6 characters with uppercase, lowercase, and numbers';
    }

    if (!userData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  // Phone validation (optional)
  if (userData.phone && !isValidPhoneNumber(userData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return errors;
};

// Profile validation
export const validateProfile = (profileData) => {
  const errors = {};

  // Name validation
  if (!profileData.name || profileData.name.trim() === '') {
    errors.name = 'Name is required';
  } else if (profileData.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // Email validation
  if (!profileData.email || profileData.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!isValidEmail(profileData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation
  if (profileData.phoneNumber) {
    if (!isValidPhoneNumber(profileData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number starting with 0';
    }
  } else {
    errors.phoneNumber = 'Phone number is required';
  }

  // Password validation (only if current password is provided)
  if (profileData.currentPassword) {
    if (!profileData.newPassword) {
      errors.newPassword = 'New password is required when changing password';
    } else if (!isStrongPassword(profileData.newPassword)) {
      errors.newPassword = 'New password must be at least 6 characters with uppercase, lowercase, and numbers';
    }

    if (!profileData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (profileData.newPassword !== profileData.confirmPassword) {
      errors.confirmPassword = 'New passwords do not match';
    }
  } else if (profileData.newPassword || profileData.confirmPassword) {
    errors.currentPassword = 'Current password is required to change password';
  }

  // Phone validation (optional)
  if (profileData.phone && !isValidPhoneNumber(profileData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return errors;
};

// Grocery item validation
export const validateGroceryItem = (groceryData) => {
  const errors = {};

  // Name validation
  if (!groceryData.name || groceryData.name.trim() === '') {
    errors.name = 'Name is required';
  }

  // Category validation
  if (!groceryData.category || groceryData.category.trim() === '') {
    errors.category = 'Category is required';
  }

  // Quantity validation
  if (!groceryData.quantity) {
    errors.quantity = 'Quantity is required';
  } else if (isNaN(groceryData.quantity) || parseFloat(groceryData.quantity) <= 0) {
    errors.quantity = 'Quantity must be a positive number';
  }

  // Unit validation
  if (!groceryData.unit || groceryData.unit.trim() === '') {
    errors.unit = 'Unit is required';
  }

  // Purchase date validation
  if (!groceryData.purchaseDate) {
    errors.purchaseDate = 'Purchase date is required';
  }

  // Expiry date validation
  if (!groceryData.expiryDate) {
    errors.expiryDate = 'Expiry date is required';
  } else if (new Date(groceryData.expiryDate) <= new Date(groceryData.purchaseDate)) {
    errors.expiryDate = 'Expiry date must be after purchase date';
  }

  return errors;
};

// Inventory item validation
export const validateInventoryItem = (inventoryData) => {
  const errors = {};

  // Name validation
  if (!inventoryData.name || inventoryData.name.trim() === '') {
    errors.name = 'Name is required';
  }

  // Category validation
  if (!inventoryData.category || inventoryData.category.trim() === '') {
    errors.category = 'Category is required';
  }

  // Location validation
  if (!inventoryData.location || inventoryData.location.trim() === '') {
    errors.location = 'Location is required';
  }

  // Description validation
  if (!inventoryData.description || inventoryData.description.trim() === '') {
    errors.description = 'Description is required';
  }

  // Value validation
  if (!inventoryData.value) {
    errors.value = 'Value is required';
  } else if (isNaN(inventoryData.value) || parseFloat(inventoryData.value) <= 0) {
    errors.value = 'Value must be a positive number';
  }

  // Purchase date validation
  if (!inventoryData.purchaseDate) {
    errors.purchaseDate = 'Purchase date is required';
  }

  // Condition validation
  if (!inventoryData.condition || inventoryData.condition.trim() === '') {
    errors.condition = 'Condition is required';
  }

  return errors;
};

// Budget entry validation
export const validateBudgetEntry = (budgetData) => {
  const errors = {};

  // Type validation
  if (!budgetData.type || (budgetData.type !== 'income' && budgetData.type !== 'expense')) {
    errors.type = 'Type must be either income or expense';
  }

  // Category validation
  if (!budgetData.category || budgetData.category.trim() === '') {
    errors.category = 'Category is required';
  }

  // Description validation
  if (!budgetData.description || budgetData.description.trim() === '') {
    errors.description = 'Description is required';
  }

  // Amount validation
  if (!budgetData.amount) {
    errors.amount = 'Amount is required';
  } else if (isNaN(budgetData.amount) || parseFloat(budgetData.amount) <= 0) {
    errors.amount = 'Amount must be a positive number';
  }

  // Date validation
  if (!budgetData.date) {
    errors.date = 'Date is required';
  }

  return errors;
};

export default {
  validateUser,
  validateProfile,
  validateGroceryItem,
  validateInventoryItem,
  validateBudgetEntry,
  isValidEmail,
  isValidPhoneNumber,
  isStrongPassword,
  formatPhoneNumber,
  formatPhoneNumberForStorage
};
