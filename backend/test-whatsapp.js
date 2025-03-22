// test-whatsapp.js
// Usage: node test-whatsapp.js
require('dotenv').config();
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const userWhatsAppNumber = process.env.TEST_PHONE
  ? (process.env.TEST_PHONE.startsWith('+') ? process.env.TEST_PHONE : `+94${process.env.TEST_PHONE.replace(/^0/, '')}`)
  : '';

if (!userWhatsAppNumber) {
  console.error('Please set TEST_PHONE in your .env file (e.g., 0771234567)');
  process.exit(1);
}

// Example content variables, customize as needed
const contentVariables = JSON.stringify({
  "1": "12/1", // e.g., expiry date
  "2": "3pm"   // e.g., time or item name
});

client.messages
  .create({
    from: 'whatsapp:+14155238886',
    contentSid: process.env.TWILIO_TEMPLATE_SID,
    contentVariables,
    to: `whatsapp:${userWhatsAppNumber}`
  })
  .then(message => console.log('WhatsApp message sent! SID:', message.sid))
  .catch(error => console.error('Error sending WhatsApp message:', error));
