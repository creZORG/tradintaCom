'use server';

import { sendTransactionalEmail } from '@/lib/email';

interface ProductDeactivationParams {
  sellerEmail: string;
  sellerName: string;
  productName: string;
  reason: string;
}

export async function sendProductDeactivatedEmail({
  sellerEmail,
  sellerName,
  productName,
  reason,
}: ProductDeactivationParams): Promise<{ success: boolean; message?: string }> {
    const emailHtml = `
        <p>Hi ${sellerName},</p>
        <p>This is an automated notification to inform you that your sponsored product, <strong>${productName}</strong>, has been temporarily unpublished from public view because ${reason}.</p>
        <p>To re-activate its sponsored placement, please update its status or stock level in your Seller Centre.</p>
        <p>Thank you,<br>The Tradinta Team</p>
    `;

    try {
        await sendTransactionalEmail({
        to: sellerEmail,
        subject: `Action Required: Your Sponsored Product "${productName}" is currently hidden`,
        htmlContent: emailHtml,
        });
        return { success: true };
    } catch (error: any) {
        console.error('Failed to send product deactivation email:', error);
        return { success: false, message: error.message };
    }
}
