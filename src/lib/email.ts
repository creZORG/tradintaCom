
'use server';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

/**
 * Sends a transactional email using Zoho ZeptoMail.
 * This function should only be called from server-side components or API routes.
 */
export async function sendTransactionalEmail({ to, subject, htmlContent }: SendEmailParams) {
  const token = process.env.ZOHO_ZEPTOMAIL_TOKEN;
  const fromEmail = process.env.ZOHO_ZEPTOMAIL_FROM_EMAIL;

  if (!token || !fromEmail) {
    console.error('Email service is not configured. Missing ZOHO_ZEPTOMAIL_TOKEN or ZOHO_ZEPTOMAIL_FROM_EMAIL in .env');
    // In production, you might want to throw an error or handle this more gracefully
    throw new Error('Email service is not configured on the server.');
  }

  const body = {
    from: {
      address: fromEmail,
      name: 'Tradinta Platform',
    },
    to: [
      {
        email_address: {
          address: to,
        },
      },
    ],
    subject: subject,
    htmlbody: htmlContent,
  };

  try {
    const response = await fetch('https://api.zeptomail.com/v1.1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Throw a detailed error based on ZeptoMail's response
      throw new Error(`ZeptoMail API Error: ${responseData.message || response.statusText}`);
    }
    
    console.log(`Email sent successfully to ${to}`);
    return responseData;
  } catch (error) {
    console.error('Failed to send transactional email:', error);
    // Re-throw the error so the calling function can handle it if needed
    throw error;
  }
}
