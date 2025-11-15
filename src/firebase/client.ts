
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseConfig } from '@/firebase/config';

// This file is for CLIENT-SIDE Firebase initialization ONLY.

type FirebaseClientServices = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

let firebaseClientServices: FirebaseClientServices | null = null;

/**
 * Initializes and returns the client-side Firebase SDKs.
 * Ensures that initialization only happens once on the client.
 */
export function getFirebaseClientServices(): FirebaseClientServices {
  if (firebaseClientServices) {
    return firebaseClientServices;
  }

  let app: FirebaseApp;
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  // Conditionally initialize Analytics only on the client side
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        getAnalytics(app);
      }
    });
  }
  
  firebaseClientServices = {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };

  return firebaseClientServices;
}
