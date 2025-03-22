# Homestock Notification System Setup

This guide will help you set up the notification system for grocery expiration alerts.

## Email Notifications Setup

1. Create an app password for your Gmail account:
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification
   - Scroll down and click on "App passwords"
   - Select "Mail" as the app and "Other" as the device
   - Enter "Homestock" as the name
   - Copy the generated app password

2. Update your `.env` file with the following:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=homestockapps@gmail.com
   EMAIL_PASSWORD=your_generated_app_password
   ```   

## WhatsApp Notifications Setup (via Twilio)

1. Create a Twilio account at https://www.twilio.com/
2. Set up a WhatsApp Sandbox in your Twilio account
3. Follow the instructions to connect your WhatsApp number to the Twilio Sandbox
4. Copy your Account SID and Auth Token from the Twilio dashboard
5. Create a WhatsApp message template in your Twilio account with variables for expiry date and item names
6. Update your `.env` file with the following:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_whatsapp_number
   TWILIO_TEMPLATE_SID=your_template_sid
   ```

## How the Notification System Works

The notification system works as follows:

1. A daily cron job runs at midnight to check for grocery items expiring in exactly 7 days
2. For each user with expiring items:
   - An email is sent listing all their expiring items
   - A WhatsApp message is sent using a Twilio template with the expiry date and item names
3. Each user receives notifications only for their own expiring items
4. The system tracks which items have already had notifications sent to avoid duplicate alerts

## Testing the Notification System

After setting up the credentials, you can test the notification system by:

1. Adding a grocery item with an expiration date 7 days from today
2. Running the following command in your terminal:

```
node test-notification.js
```

This will manually trigger the notification check without waiting for the daily cron job.

## Troubleshooting

- If email notifications are not working, check that:
  - Your Gmail app password is correct
  - Less secure app access is enabled (if using a regular password)
  - Your email service provider isn't blocking the automated emails

- If WhatsApp notifications are not working, check that:
  - Your Twilio account is active and has sufficient credits
  - You've properly joined the Twilio WhatsApp Sandbox
  - The phone number format is correct (should be in E.164 format)
  - Your WhatsApp template is approved and the contentSid is correct
