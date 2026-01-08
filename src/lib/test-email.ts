import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from './ses';
import 'dotenv/config'; // Load .env variables

async function sendTest() {
  const command = new SendEmailCommand({
    Source: 'sarthaklaptop402@gmail.com', // ⚠️ Replace this with your actual verified email
    Destination: {
      ToAddresses: ['sarthaklaptop402@gmail.com'], // ⚠️ Replace this too
    },
    Message: {
      Subject: { Data: 'Hello from Fwd! 🚀' },
      Body: {
        Text: {
          Data: 'This is a test email from your local Node.js environment.',
        },
      },
    },
  });

  try {
    const response = await ses.send(command);
    console.log(
      '✅ Email sent! Message ID:',
      response.MessageId
    );
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

sendTest();
