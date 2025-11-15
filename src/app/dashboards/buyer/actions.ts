
'use server';

import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import UAParser from 'ua-parser-js';

// Initialize Firebase Admin SDK
customInitApp();
const db = getFirestore();

// --- Profile Update Schema ---
const ProfileUpdateSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters.'),
  userId: z.string().min(1, 'User ID is missing.'),
});

export async function updateUserProfile(prevState: any, formData: FormData) {
  const validatedFields = ProfileUpdateSchema.safeParse({
    fullName: formData.get('fullName'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { fullName, userId } = validatedFields.data;
  const auth = getAuth();
  const userDocRef = db.collection('users').doc(userId);

  try {
    // Update Firebase Auth display name
    await auth.updateUser(userId, { displayName: fullName });
    // Update Firestore document
    await userDocRef.update({ fullName: fullName });

    revalidatePath('/dashboards/buyer/settings');
    revalidatePath('/dashboards/buyer');

    return { success: true, message: 'Your profile has been updated successfully.' };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.',
    };
  }
}

// --- Password Change Schema ---
const PasswordChangeSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
    userId: z.string().min(1, 'User ID is missing.'),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export async function changeUserPassword(prevState: any, formData: FormData) {
    const validatedFields = PasswordChangeSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
          success: false,
          message: 'Invalid input.',
          errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { newPassword, userId } = validatedFields.data;
    const auth = getAuth();

    try {
        await auth.updateUser(userId, { password: newPassword });
        return { success: true, message: 'Your password has been changed successfully.' };
    } catch (error: any) {
        console.error('Error changing password:', error);
        return {
          success: false,
          message: error.message || 'An unexpected error occurred while changing the password.',
        };
    }
}

export async function logUserSession(userId: string, userAgent: string | null): Promise<{ sessionId?: string }> {
  try {
    const uaParser = new UAParser(userAgent || undefined);
    const result = uaParser.getResult();

    const sessionRef = db.collection('users').doc(userId).collection('sessions').doc(userId);
    
    await sessionRef.set({
        lastLogin: new Date(),
        browser: `${result.browser.name} ${result.browser.version}`,
        os: `${result.os.name} ${result.os.version}`,
        device: result.device.vendor ? `${result.device.vendor} ${result.device.model}` : 'Desktop',
    }, { merge: true });

    return { sessionId: sessionRef.id };
  } catch (error) {
    console.error('Error logging user session:', error);
    return {};
  }
}

export async function deleteUserSession(userId: string, sessionId: string): Promise<void> {
  try {
    const sessionRef = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
    await sessionRef.delete();
  } catch (error) {
    console.error('Error deleting user session:', error);
  }
}


export async function requestAccountDeletion(userId: string): Promise<{ success: boolean, message?: string }> {
  const auth = getAuth();
  const userDocRef = db.collection('users').doc(userId);

  try {
    // Soft delete: Disable the user in Firebase Auth
    await auth.updateUser(userId, { disabled: true });
    
    // Mark the user as deactivated in Firestore
    await userDocRef.update({
      status: 'deactivated',
      deletionRequestedAt: new Date(),
    });

    // Optionally revoke refresh tokens to invalidate current sessions
    await auth.revokeRefreshTokens(userId);

    return { success: true, message: 'Account deactivated successfully.' };
  } catch (error: any) {
    console.error('Error during account deletion request:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred while deactivating the account.',
    };
  }
}

export async function revokeAllSessions(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const auth = getAuth();
    await auth.revokeRefreshTokens(userId);
    
    // Also update the user document to reflect this action for auditing
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update({
      sessionsRevokedAt: new Date(),
    });

    revalidatePath('/dashboards/buyer/settings');

    return { success: true, message: 'All active sessions have been revoked.' };
  } catch (error: any) {
    console.error(`Error revoking sessions for user ${userId}:`, error);
    return {
      success: false,
      message: 'Could not revoke sessions at this time.',
    };
  }
}

export async function unfollowEntity(userId: string, targetId: string, targetType: 'manufacturer' | 'partner') {
    const userFollowingRef = db.collection('users').doc(userId).collection('following').doc(targetId);
    const targetFollowerRef = db.collection(`${targetType}s`).doc(targetId).collection('followers').doc(userId);

    try {
        await userFollowingRef.delete();
        await targetFollowerRef.delete();
        return { success: true };
    } catch(error: any) {
        console.error(`Error unfollowing entity ${targetId}:`, error);
        return { success: false, message: error.message };
    }
}
