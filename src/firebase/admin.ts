
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential, ServiceAccount } from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

function getServiceAccount(): ServiceAccount | undefined {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;
  if (!serviceAccountB64) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY_B64 environment variable is not set. Server-side Firebase features will be disabled.');
    }
    return undefined;
  }

  try {
    const decodedServiceAccount = Buffer.from(serviceAccountB64, 'base64').toString('utf8');
    const serviceAccountJson = JSON.parse(decodedServiceAccount);

    if (serviceAccountJson.private_key) {
        serviceAccountJson.private_key = serviceAccountJson.private_key.replace(/\\n/g, '\n');
    }
    
    return serviceAccountJson;

  } catch (error) {
    console.error('Failed to parse Firebase service account key:', error);
    throw new Error('The Firebase service account key is not a valid Base64 encoded JSON string.');
  }
}

// A memoized function to get the initialized Firebase Admin App
const getAdminApp = (() => {
  let app: App | undefined;
  return async (): Promise<App | undefined> => {
    if (app) {
      return app;
    }

    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
      console.warn("Service account is not available, Firebase Admin SDK not initialized.");
      return undefined;
    }

    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp({
        credential: credential.cert(serviceAccount),
      });
    }
    return app;
  };
})();

/**
 * Initializes and returns the Firebase Admin SDK App.
 * Ensures that initialization only happens once.
 * This is the primary entry point for server-side Firebase functionality.
 */
export async function customInitApp(): Promise<App | undefined> {
  return await getAdminApp();
}
