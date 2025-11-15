
'use server';

import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import { createHash } from 'crypto';

// Initialize Firebase Admin SDK
customInitApp();

export async function awardPoints(firestore: Firestore, userId: string, points: number, reasonCode: string, metadata: object = {}) {
    const eventRef = firestore.collection('pointsLedgerEvents').doc();
    
    // Create a deterministic payload for hashing
    const payload = {
        event_id: eventRef.id,
        user_id: userId,
        points: points,
        action: 'award',
        reason_code: reasonCode,
        metadata: metadata,
        timestamp: new Date().toISOString(), // Use a consistent timestamp format for hashing
    };

    // Generate a hash of the payload
    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    const eventData = {
        ...payload,
        created_at: FieldValue.serverTimestamp(), // Use server timestamp for actual storage
        event_hash: hash,
        issued_by: 'system', // Indicate this was a system-generated event
    };
    
    // We don't want to block the user flow, so we don't await this.
    eventRef.set(eventData).catch(err => console.error(`Failed to award points for ${reasonCode}:`, err));
}
