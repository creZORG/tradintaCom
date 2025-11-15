
'use client';

// Re-export client-side services and hooks.
// This file should NOT export anything from 'firebase/admin.ts'.

export * from './client'; // Exports getFirebaseClientServices
export * from './provider';
export * from './client-provider';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './non-blocking-updates';
