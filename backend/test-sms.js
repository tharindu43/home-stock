// test-sms.js
// Usage: node test-sms.js
require('dotenv').config();
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Set the phone number you want to send to (in international format)
const userPhoneNumber = process.env.TEST_PHONE ? 
  (process.env.TEST_PHONE.startsWith('+') ? process.env.TEST_PHONE : `+94${process.env.TEST_PHONE.replace(/^0/, '')}`) : '';

const messageText = 'Homestock test SMS: Your notification system is working!';

if (!userPhoneNumber) {
  console.error('Please set TEST_PHONE in your .env file (e.g., 0771234567)');
  process.exit(1);
}

client.messages
  .create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: userPhoneNumber,
    body: messageText
  })
  .then(message => console.log('SMS sent! SID:', message.sid))
  .catch(error => console.error('Error sending SMS:', error));
