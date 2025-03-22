const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const groceryRoutes = require('./routes/groceryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import notification service
const { checkExpiringGroceries } = require('./services/notificationService');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define routes
app.use('/api/users', userRoutes);
app.use('/api/groceries', groceryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Homestock API is running...');
});

// Schedule cron job to check for expiring groceries daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily check for expiring groceries');
  try {
    await checkExpiringGroceries();
    console.log('Expiry check completed successfully');
  } catch (error) {
    console.error('Error in expiry check cron job:', error);
  }
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });
