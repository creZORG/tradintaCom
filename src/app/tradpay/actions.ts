

'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { customInitApp } from '@/firebase/admin';

// Initialize Firebase Admin SDK
customInitApp();
const db = getFirestore();

const WaitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

interface FormState {
  message: string;
  success: boolean;
  email?: string;
}

export async function addToTradepayWaitlist(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = WaitlistSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.email?.[0] || 'Invalid input.',
      success: false,
    };
  }

  const { email } = validatedFields.data;

  try {
    const waitlistRef = db.collection('tradepayWaitlist').doc(email);
    const docSnap = await waitlistRef.get();

    if (docSnap.exists) {
      return {
        message: 'This email is already on the waitlist.',
        success: true, // Treat as success to show the "You\'re on the list" message
        email: email,
      };
    }

    await waitlistRef.set({
      email: email,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      message: "You've been added to the waitlist!",
      success: true,
      email: email,
    };

  } catch (error) {
    console.error('Error adding to TradePay waitlist:', error);
    return {
      message: 'An unexpected error occurred. Please try again.',
      success: false,
    };
  }
}
