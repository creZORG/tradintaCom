
'use server';

import {
  addDoc,
  collection,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertStatus = 'new' | 'acknowledged' | 'resolved';

/**
 * Creates a system alert document in Firestore.
 * This should be called from trusted server-side environments or within secure Firebase rules.
 *
 * @param firestore - The Firestore database instance.
 * @param type - A machine-readable key for the alert type (e.g., 'NEW_USER_REPORT').
 * @param severity - The severity level of the alert.
 * @param message - A human-readable summary of the alert.
 * @param details - An optional object containing additional data related to the alert.
 */
export const createSystemAlert = async (
  firestore: Firestore,
  type: string,
  severity: AlertSeverity,
  message: string,
  details?: Record<string, any>
) => {
  try {
    const alertData = {
      id: nanoid(),
      timestamp: serverTimestamp(),
      type,
      severity,
      message,
      status: 'new' as AlertStatus,
      details: details || {},
    };
    await addDoc(collection(firestore, 'systemAlerts'), alertData);
    console.log(`System alert created: ${type} - ${message}`);
  } catch (error) {
    console.error('Failed to create system alert:', error);
  }
};
