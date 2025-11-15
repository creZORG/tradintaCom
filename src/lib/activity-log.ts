'use server';

import {
  addDoc,
  collection,
  serverTimestamp,
  type Firestore,
} from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import { nanoid } from 'nanoid';
import { getDb } from './firebase-admin';

/**
 * Logs an administrative action to the activityLogs collection.
 * This function is now purely for logging and does not send emails.
 *
 * @param action - A machine-readable key for the action (e.g., 'VERIFICATION_APPROVED').
 * @param details - A human-readable description of what happened.
 */
export const logActivity = async (
  firestore: Firestore,
  auth: Auth | null,
  action: string,
  details: string
) => {
  if (!firestore || !auth?.currentUser) {
    console.error('Firestore or authenticated user not available for logging activity');
    return;
  }

  try {
    const logData = {
      id: nanoid(),
      timestamp: serverTimestamp(),
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      action,
      details,
    };
    await addDoc(collection(firestore, 'activityLogs'), logData);
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
};
