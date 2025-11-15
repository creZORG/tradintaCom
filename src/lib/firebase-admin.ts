
'use server';

import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';

let db: Firestore | null = null;

/**
 * Gets the initialized Firestore Admin instance.
 * Ensures that initialization happens only once.
 * @returns The Firestore admin instance, or throws an error if initialization fails.
 */
export async function getDb(): Promise<Firestore> {
  if (db) {
    return db;
  }

  const app = await customInitApp();
  if (!app) {
    // This will provide a clearer error message if the admin SDK fails to initialize.
    throw new Error(
      'Firebase Admin SDK initialization failed. Check your service account credentials.'
    );
  }

  db = getFirestore(app);
  return db;
}
