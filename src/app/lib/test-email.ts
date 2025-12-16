import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function sendTest() {
  const command = new SendEmailCommand({
    Source: "your-verified-email@gmail.com", // MUST be verified in SES
    Destination: {
      ToAddresses: ["your-verified-email@gmail.com"], // MUST be verified in Sandbox mode
    },
    Message: {
      Subject: { Data: "Hello from Fwd! 🚀" },
      Body: {
        Text: { Data: "This is a test email from your local Node.js environment." },
      },
    },
  });

  try {
    const response = await ses.send(command);
    console.log("✅ Email sent! Message ID:", response.MessageId);
  } catch (error) {
    console.error("❌ Failed:", error);
  }
}

sendTest();