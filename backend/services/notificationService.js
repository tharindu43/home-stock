const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Grocery = require('../models/Grocery');
const User = require('../models/User');

// Configure email transporter
const configureEmailTransporter = async () => {
  // For testing purposes, use the configured Ethereal account
  if (process.env.EMAIL_SERVICE === 'ethereal') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // For production, use the configured email service
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Configure Twilio client
const configureTwilioClient = () => {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

// Format Sri Lankan phone number for international use
const formatPhoneNumber = (phoneNumber) => {
  // If phone number starts with 0, replace with +94
  if (phoneNumber.startsWith('0')) {
    return `+94${phoneNumber.substring(1)}`;
  }
  
  // If phone number already has country code, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // If phone number doesn't have any prefix, add +94
  return `+94${phoneNumber}`;
};

// Send email notification
const sendEmailNotification = async (user, expiringItems) => {
  try {
    const transporter = await configureEmailTransporter();

    // Determine days until expiry based on first item
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const firstExpiry = new Date(expiringItems[0].expiryDate);
    firstExpiry.setHours(0, 0, 0, 0);
    const diffTime = firstExpiry - today;
    const daysNotice = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Create HTML content for email with dynamic days notice
    let itemsList = '';
    expiringItems.forEach(item => {
      const expiryDate = new Date(item.expiryDate).toLocaleDateString();
      const expDate = new Date(item.expiryDate); expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      itemsList += `<li><strong>${item.name}</strong> - Expires on: ${expiryDate} (in ${diffDays} days)</li>`;
    });

    // Build recipients array: always user's email, and if phoneNumber exists, add SMS gateway address
    const recipients = [user.email];
    if (user.phoneNumber) {
      // TODO: Replace this with the correct SMS gateway domain for the user's carrier
      // Example for placeholder: '07XXXXXXXX@sms.srilanka.example'
      const phoneDigits = user.phoneNumber.replace(/^0/, ''); // remove leading 0
      const smsGateway = `${phoneDigits}@sms.srilanka.example`;
      recipients.push(smsGateway);
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || '"Homestock App" <notifications@homestock.app>',
      to: recipients,
      subject: `Homestock: Grocery Items Expiring in ${daysNotice} days`,
      html: `
        <h2>Hello ${user.name},</h2>
        <p>The following grocery items in your Homestock inventory will expire in ${daysNotice} days:</p>
        <ul>
          ${itemsList}
        </ul>
        <p>Please check your Homestock app for more details.</p>
        <p>Thank you for using Homestock!</p>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email notification sent to ${user.email}`);
    
    // If using Ethereal, provide the preview URL
    if (process.env.EMAIL_SERVICE === 'ethereal') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
};

// Determine WhatsApp sender address
const defaultWhatsAppSandbox = '+14155238886';
const rawWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || defaultWhatsAppSandbox;
const WHATSAPP_FROM = rawWhatsAppFrom.startsWith('whatsapp:') ? rawWhatsAppFrom : `whatsapp:${rawWhatsAppFrom}`;

// Send WhatsApp notification using Twilio
const sendWhatsAppNotification = async (user, expiringItems) => {
  try {
    const client = configureTwilioClient();
    
    // Format phone number for international use
    const phoneNumber = formatPhoneNumber(user.phoneNumber);
    
    console.log(`Sending WhatsApp notification to: ${phoneNumber}`);
    
    // Get the first expiry date for the template
    const expiryDate = new Date(expiringItems[0].expiryDate).toLocaleDateString();
    
    // Create a list of item names
    const itemNames = expiringItems.map(item => item.name).join(', ');
    
    // Send a plain text WhatsApp message
    const messageBody = `Hello ${user.name}, your item(s) ${itemNames} will expire on ${expiryDate}. Please check your Homestock inventory.`;
    console.log(`Sending WhatsApp from: ${WHATSAPP_FROM} to: whatsapp:${phoneNumber}`);
    await client.messages.create({
      from: WHATSAPP_FROM,
      to: `whatsapp:${phoneNumber}`,
      body: messageBody
    });
    
    console.log(`WhatsApp notification sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    if (error.code === 63007) {
      console.warn('WhatsApp sender unconfigured. Set TWILIO_WHATSAPP_FROM to a valid WhatsApp-enabled number.');
    } else {
      console.error('Error sending WhatsApp notification:', error);
    }
    return false;
  }
};

// Send SMS notification as a fallback
const sendSMSNotification = async (user, expiringItems) => {
  try {
    const client = configureTwilioClient();
    
    // Format phone number for international use
    const phoneNumber = formatPhoneNumber(user.phoneNumber);
    
    console.log(`Sending SMS notification to: ${phoneNumber}`);
    
    // Create message content
    let message = `Hello ${user.name}, the following grocery items in your Homestock inventory will expire in 7 days:\n\n`;
    
    expiringItems.forEach(item => {
      const expiryDate = new Date(item.expiryDate).toLocaleDateString();
      message += `• ${item.name} - Expires on: ${expiryDate}\n`;
    });
    
    message += '\nPlease check your Homestock app for more details.';
    
    // Send SMS message
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log(`SMS notification sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    if (error.code === 21608) {
      console.warn(`Twilio trial cannot send SMS to unverified number ${formatPhoneNumber(user.phoneNumber)}. Skipping SMS notifications.`);
    } else {
      console.error('Error sending SMS notification:', error);
    }
    return false;
  }
};

// Check for expiring groceries and send notifications
const checkExpiringGroceries = async () => {
  try {
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    // Get date exactly 7 days from now
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999); // Set to end of day
    
    console.log(`Checking for groceries expiring on ${sevenDaysLater.toLocaleDateString()}`);
    
    // Find groceries already expired or expiring within the next 7 days (including today) where notification hasn't been sent
    const expiringGroceries = await Grocery.find({
      expiryDate: { $lte: sevenDaysLater },
      notificationSent: { $ne: true },
      user: { $exists: true, $ne: null }
    }).populate('user');
    
    console.log(`Found ${expiringGroceries.length} groceries expiring in 7 days`);
    
    // Filter out any groceries where populate failed (no user)
    const validExpiringGroceries = expiringGroceries.filter(grocery => {
      if (!grocery.user) {
        console.log(`Grocery ${grocery.name} has no user. Skipping notification.`);
        return false;
      }
      return true;
    });
    console.log(`Proceeding with ${validExpiringGroceries.length} groceries with valid user`);
    
    // Group expiring groceries by user
    const userGroceryMap = new Map();
    
    for (const grocery of validExpiringGroceries) {
      const userId = grocery.user._id.toString();
      
      if (!userGroceryMap.has(userId)) {
        userGroceryMap.set(userId, {
          user: grocery.user,
          groceries: [],
        });
      }
      
      userGroceryMap.get(userId).groceries.push(grocery);
    }
    
    console.log(`Grouped groceries for ${userGroceryMap.size} users`);
    
    // Send notifications to each user
    const notificationPromises = [];
    
    for (const [userId, data] of userGroceryMap.entries()) {
      const { user, groceries } = data;
      
      console.log(`Sending notifications to user ${user.name} (${user.email}) for ${groceries.length} groceries`);
      
      // Send email notification
      const emailPromise = sendEmailNotification(user, groceries)
        .then(emailSent => {
          if (emailSent) {
            console.log(`Email notification sent successfully to ${user.email}`);
          }
          return emailSent;
        });
      
      // Send both WhatsApp and SMS messages in parallel
      const messagePromise = Promise.all([
        sendWhatsAppNotification(user, groceries),
        sendSMSNotification(user, groceries)
      ]).then(([whatsAppSent, smsSent]) => {
        if (whatsAppSent) {
          console.log(`WhatsApp notification sent successfully to ${user.phoneNumber}`);
        } else {
          console.log(`WhatsApp notification failed for ${user.phoneNumber}`);
        }
        if (smsSent) {
          console.log(`SMS notification sent successfully to ${user.phoneNumber}`);
        } else {
          console.log(`SMS notification failed for ${user.phoneNumber}`);
        }
        return whatsAppSent || smsSent;
      });
      
      // Add email and message promises to the array
      notificationPromises.push(
        Promise.all([emailPromise, messagePromise])
          .then(([emailSent, messageSent]) => {
            // Update notification status if either email or message notification was sent
            if (emailSent || messageSent) {
              const updatePromises = groceries.map(grocery => 
                Grocery.findByIdAndUpdate(grocery._id, { notificationSent: true })
                  .then(() => console.log(`Marked notification as sent for grocery: ${grocery.name}`))
              );
              return Promise.all(updatePromises);
            }
          })
      );
    }
    
    // Wait for all notifications to be processed
    await Promise.all(notificationPromises);
    
    return {
      success: true,
      message: `Checked ${expiringGroceries.length} expiring groceries and sent notifications to ${userGroceryMap.size} users.`,
    };
  } catch (error) {
    console.error('Error checking expiring groceries:', error);
    return {
      success: false,
      message: 'Failed to check expiring groceries.',
      error: error.message,
    };
  }
};

module.exports = {
  checkExpiringGroceries,
  sendEmailNotification,
  sendWhatsAppNotification,
  sendSMSNotification,
};
