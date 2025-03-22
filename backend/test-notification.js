/**
 * Test script for the grocery expiration notification system
 * 
 * This script creates a test grocery item with an expiration date 7 days from now
 * and then triggers the notification system to verify it works correctly.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Grocery = require('./models/Grocery');
const User = require('./models/User');
const { 
  checkExpiringGroceries, 
  sendEmailNotification, 
  sendWhatsAppNotification,
  sendSMSNotification 
} = require('./services/notificationService');

// Set your test email and phone number here
const TEST_EMAIL = process.env.TEST_EMAIL || 'thariduperera09@gmail.com';
const TEST_PHONE = process.env.TEST_PHONE || '0771981249'; // Updated to use 0 prefix format

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to create a test grocery item
async function createTestGroceryItem(userId) {
  try {
    // Calculate expiry date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    // Delete any existing test grocery items for this user
    await Grocery.deleteMany({ 
      user: userId, 
      name: 'Test Milk', 
      notificationSent: false 
    });
    
    // Create a test grocery item
    const grocery = new Grocery({
      user: userId,
      name: 'Test Milk',
      category: 'Dairy',
      quantity: 1,
      unit: 'liter',
      purchaseDate: new Date(),
      expiryDate: expiryDate,
      notificationSent: false,
      notes: 'Test item for notification system'
    });
    
    await grocery.save();
    console.log(`Created test grocery item with expiry date: ${expiryDate.toLocaleDateString()}`);
    return grocery;
  } catch (error) {
    console.error('Error creating test grocery item:', error);
    throw error;
  }
}

// Function to find a user or create a test user if none exists
async function findOrCreateTestUser() {
  try {
    // Try to find an existing user with the test email
    let user = await User.findOne({ email: TEST_EMAIL });
    
    if (!user) {
      console.log(`No user found with email ${TEST_EMAIL}. Creating a test user...`);
      // Create a test user
      user = new User({
        name: 'Test User',
        email: TEST_EMAIL,
        password: 'password123',
        phoneNumber: TEST_PHONE,
      });
      
      await user.save();
      console.log('Created test user:', user.email);
    } else {
      console.log('Using existing user:', user.email);
      // Update phone number if needed
      if (user.phoneNumber !== TEST_PHONE) {
        user.phoneNumber = TEST_PHONE;
        await user.save();
        console.log(`Updated phone number to: ${TEST_PHONE}`);
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error finding or creating test user:', error);
    throw error;
  }
}

// Function to test email notification directly
async function testEmailNotification(user, grocery) {
  console.log('\n--- Testing Email Notification ---');
  console.log(`Sending test email to: ${user.email}`);
  
  try {
    const result = await sendEmailNotification(user, [grocery]);
    if (result) {
      console.log('✅ Email notification sent successfully!');
    } else {
      console.log('❌ Failed to send email notification.');
    }
    return result;
  } catch (error) {
    console.error('Error testing email notification:', error);
    return false;
  }
}

// Function to test WhatsApp notification directly
async function testWhatsAppNotification(user, grocery) {
  console.log('\n--- Testing WhatsApp Notification ---');
  console.log(`Sending test WhatsApp message to: ${user.phoneNumber}`);
  
  try {
    const result = await sendWhatsAppNotification(user, [grocery]);
    if (result) {
      console.log('✅ WhatsApp notification sent successfully!');
    } else {
      console.log('❌ Failed to send WhatsApp notification.');
    }
    return result;
  } catch (error) {
    console.error('Error testing WhatsApp notification:', error);
    return false;
  }
}

// Function to test SMS notification directly
async function testSMSNotification(user, grocery) {
  console.log('\n--- Testing SMS Notification ---');
  console.log(`Sending test SMS to: ${user.phoneNumber}`);
  
  try {
    const result = await sendSMSNotification(user, [grocery]);
    if (result) {
      console.log('✅ SMS notification sent successfully!');
    } else {
      console.log('❌ Failed to send SMS notification.');
    }
    return result;
  } catch (error) {
    console.error('Error testing SMS notification:', error);
    return false;
  }
}

// Main function to run the test
async function runTest() {
  try {
    console.log('Starting notification system test...');
    console.log(`Using test email: ${TEST_EMAIL}`);
    console.log(`Using test phone: ${TEST_PHONE}`);
    
    // Find or create a test user
    const user = await findOrCreateTestUser();
    
    // Create a test grocery item
    const grocery = await createTestGroceryItem(user._id);
    
    // Test email notification
    const emailResult = await testEmailNotification(user, grocery);
    
    // Test WhatsApp notification
    const whatsAppResult = await testWhatsAppNotification(user, grocery);
    
    // Test SMS notification if WhatsApp fails
    let smsResult = false;
    if (!whatsAppResult) {
      console.log('\nWhatsApp notification failed, trying SMS as fallback');
      smsResult = await testSMSNotification(user, grocery);
    }
    
    // Run the full notification check
    console.log('\n--- Testing Full Notification System ---');
    console.log('Running notification check...');
    const result = await checkExpiringGroceries();
    
    console.log('\n--- Test Summary ---');
    console.log('Email notification:', emailResult ? 'Sent ✅' : 'Failed ❌');
    console.log('WhatsApp notification:', whatsAppResult ? 'Sent ✅' : 'Failed ❌');
    if (!whatsAppResult) {
      console.log('SMS notification (fallback):', smsResult ? 'Sent ✅' : 'Failed ❌');
    }
    console.log('Full system check:', result.success ? 'Success ✅' : 'Failed ❌');
    
    if (emailResult && (whatsAppResult || smsResult)) {
      console.log('\n✅ All tests passed! The notification system is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the logs above for details.');
    }
    
    // Provide troubleshooting guidance
    if (!emailResult) {
      console.log('\nEmail Troubleshooting Tips:');
      console.log('1. Check that EMAIL_USER and EMAIL_PASSWORD in .env are correct');
      console.log('2. For Gmail, ensure you\'ve created an app password');
      console.log('3. Check that "Less secure app access" is enabled if using regular password');
    }
    
    if (!whatsAppResult) {
      console.log('\nWhatsApp Troubleshooting Tips:');
      console.log('1. Check that your Twilio account is active and has sufficient credits');
      console.log('2. Ensure you\'ve joined the Twilio WhatsApp Sandbox by sending the correct code');
      console.log('3. Verify that your phone number format is correct (should start with 0)');
      console.log('4. Check that your WhatsApp template is approved in the Twilio console');
    }
    
    if (!whatsAppResult && !smsResult) {
      console.log('\nSMS Troubleshooting Tips:');
      console.log('1. Check that your Twilio account is active and has sufficient credits');
      console.log('2. Verify that your phone number format is correct (should start with 0)');
      console.log('3. Ensure your Twilio phone number can send SMS messages');
      console.log('4. Check the Twilio console for any error messages');
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
runTest();
