
'use server';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import { sendTransactionalEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import type { User } from 'firebase/auth';

customInitApp();
const db = getFirestore();

const OTP_EXPIRY_MINUTES = 10;
const MAX_RESEND_ATTEMPTS = 3;

/**
 * Checks for a device cookie. If not present, generates and sends an OTP.
 * @param user - The Firebase authenticated user object.
 * @returns An object indicating if OTP is required.
 */
export async function checkDeviceAndTriggerOtp(user: User): Promise<{ otpRequired: boolean }> {
  const cookieStore = cookies();
  const deviceId = cookieStore.get('tradinta-did')?.value;
  const deviceRef = deviceId ? db.collection('users').doc(user.uid).collection('trustedDevices').doc(deviceId) : null;
  const deviceSnap = deviceRef ? await deviceRef.get() : null;

  if (deviceSnap && deviceSnap.exists) {
    // Device is trusted, do nothing.
    return { otpRequired: false };
  }

  // Device not trusted, generate and send OTP.
  await createAndSendOtp(user.uid, user.email!, user.displayName || 'User');
  return { otpRequired: true };
}

/**
 * Creates an OTP, stores it in Firestore, and sends it via email.
 * @param userId - The ID of the user.
 * @param email - The email address to send the OTP to.
 * @param name - The user's display name.
 * @returns The generated 6-digit code.
 */
async function createAndSendOtp(userId: string, email: string, name: string): Promise<string> {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + OTP_EXPIRY_MINUTES);

  const otpRef = db.collection('loginOtps').doc(userId);
  await otpRef.set({
    code: otpCode,
    expires: Timestamp.fromDate(expires),
    attempts: 0,
    resendCount: 1, // Initialize resend count
  });

  const emailHtml = `
      <p>Hi ${name},</p>
      <p>A sign-in attempt requires verification. Use the code below to complete your login. This code is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otpCode}</p>
      <p>If you did not request this code, please secure your account immediately.</p>
    `;

  await sendTransactionalEmail({
    to: email,
    subject: 'Your Tradinta Verification Code',
    htmlContent: emailHtml,
  });

  return otpCode;
}


/**
 * Resends the OTP, enforcing a rate limit.
 */
export async function resendOtp(userId: string, email: string, name: string): Promise<{ success: boolean; message: string }> {
  const otpRef = db.collection('loginOtps').doc(userId);
  const otpSnap = await otpRef.get();

  if (!otpSnap.exists) {
    return { success: false, message: 'No pending OTP found. Please try logging in again.' };
  }

  const otpData = otpSnap.data()!;
  if (otpData.resendCount >= MAX_RESEND_ATTEMPTS) {
    return { success: false, message: 'You have reached the maximum number of resend attempts.' };
  }
  
  await otpRef.update({ resendCount: FieldValue.increment(1) });
  await createAndSendOtp(userId, email, name);

  return { success: true, message: 'A new verification code has been sent to your email.' };
}


/**
 * Verifies the OTP and sets a device cookie upon success.
 */
export async function verifyLoginOtpAndGrantSession(userId: string, code: string): Promise<{ success: boolean; message: string }> {
  const otpRef = db.collection('loginOtps').doc(userId);
  const otpSnap = await otpRef.get();

  if (!otpSnap.exists) {
    return { success: false, message: 'Verification failed. Please request a new code.' };
  }

  const otpData = otpSnap.data()!;

  if (otpData.expires.toDate() < new Date()) {
    await otpRef.delete();
    return { success: false, message: 'Your verification code has expired.' };
  }
  
  if (otpData.attempts >= 5) {
      await otpRef.delete();
      return { success: false, message: 'Too many incorrect attempts. Please log in again.' };
  }

  if (otpData.code !== code) {
    await otpRef.update({ attempts: FieldValue.increment(1) });
    return { success: false, message: 'Invalid code. Please try again.' };
  }

  // --- Success ---
  // 1. Mark the device as trusted
  const deviceId = nanoid();
  const deviceRef = db.collection('users').doc(userId).collection('trustedDevices').doc(deviceId);
  await deviceRef.set({
    addedAt: Timestamp.now(),
    userAgent: cookies().get('user-agent')?.value || 'Unknown', // Example, more data can be added
  });

  // 2. Set the trusted device cookie
  cookies().set('tradinta-did', deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    path: '/',
  });
  
  // 3. Delete the used OTP
  await otpRef.delete();

  return { success: true, message: 'Device verified successfully!' };
}

