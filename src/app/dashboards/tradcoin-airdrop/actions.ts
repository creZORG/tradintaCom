
'use server';

import { getFirestore, FieldValue, DocumentReference, Timestamp } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { awardPoints } from '@/lib/points';

customInitApp();
const db = getFirestore();

interface GenerateCodesParams {
  count: number;
  points: number;
  expiresAt?: Date;
}

export async function generateClaimCodes({
  count,
  points,
  expiresAt,
}: GenerateCodesParams): Promise<{ success: boolean; message: string; codes?: string[] }> {
  try {
    if (count > 1000) {
        throw new Error("Cannot generate more than 1000 codes at a time.");
    }
    const batch = db.batch();
    const newCodes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = nanoid(8).toUpperCase();
        newCodes.push(code);
        const codeRef = db.collection('claimCodes').doc(code);
        batch.set(codeRef, {
            code,
            points,
            status: 'active',
            expiresAt: expiresAt || null,
            createdAt: FieldValue.serverTimestamp(),
            claimedBy: null,
            claimedAt: null,
        });
    }
    await batch.commit();
    return { success: true, message: 'Codes generated successfully.', codes: newCodes };
  } catch (error: any) {
    console.error("Error generating claim codes:", error);
    return { success: false, message: error.message };
  }
}

export async function voidClaimCode(codeId: string): Promise<{ success: boolean; message: string }> {
    try {
        const codeRef = db.collection('claimCodes').doc(codeId);
        await codeRef.update({ status: 'voided' });
        return { success: true, message: 'Code voided successfully.' };
    } catch(error: any) {
        console.error("Error voiding claim code:", error);
        return { success: false, message: error.message };
    }
}

export async function claimCodeAction(userId: string, code: string): Promise<{ success: boolean, message: string }> {
    if (!userId || !code) {
        return { success: false, message: "User ID and code are required." };
    }

    const claimCodeRef = db.collection('claimCodes').doc(code.toUpperCase());
    const userRef = db.collection('users').doc(userId);

    try {
        const result = await db.runTransaction(async (transaction) => {
            const codeDoc = await transaction.get(claimCodeRef);
            const userDoc = await transaction.get(userRef);

            if (!codeDoc.exists) {
                throw new Error("Invalid claim code.");
            }

            const codeData = codeDoc.data()!;
            if (codeData.status !== 'active') {
                throw new Error(`This code has already been ${codeData.status}.`);
            }
            if (codeData.expiresAt && codeData.expiresAt.toDate() < new Date()) {
                transaction.update(claimCodeRef, { status: 'expired' });
                throw new Error("This claim code has expired.");
            }

            if (!userDoc.exists) {
                 throw new Error("User profile not found.");
            }
            const userData = userDoc.data()!;
            if (userData.tradPointsStatus?.isBanned) {
                throw new Error("This account is not eligible to claim points.");
            }

            // Optional: Add a cooldown period
            const lastClaimedAt = userData.lastClaimedAt as Timestamp | undefined;
            if (lastClaimedAt) {
                const twentyFourHoursAgo = new Date();
                twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
                if (lastClaimedAt.toDate() > twentyFourHoursAgo) {
                    throw new Error("You can only claim one code every 24 hours.");
                }
            }
            
            // All checks passed, proceed with claim
            transaction.update(claimCodeRef, {
                status: 'claimed',
                claimedBy: userId,
                claimedAt: FieldValue.serverTimestamp(),
            });

            transaction.update(userRef, {
                lastClaimedAt: FieldValue.serverTimestamp(),
            });
            
            // awardPoints is a fire-and-forget async function, so we don't need to wrap it in the transaction
            return { points: codeData.points };
        });

        // Award points outside the transaction
        await awardPoints(db, userId, result.points, 'PROMOTIONAL_GIFT', { claimCode: code.toUpperCase() });

        return { success: true, message: `Successfully claimed ${result.points} points!` };

    } catch (error: any) {
        console.error("Claim code transaction failed: ", error);
        return { success: false, message: error.message };
    }
}


export async function findUserAndTheirPoints(identifier: string): Promise<{ success: boolean; message?: string; user?: any }> {
    try {
        let userDocRef: DocumentReference;

        if (identifier.includes('@')) {
             const emailDoc = await db.collection('emails').doc(identifier).get();
             if (!emailDoc.exists) throw new Error('User with this email not found.');
             const userId = emailDoc.data()!.userId;
             userDocRef = db.collection('users').doc(userId);
        } else {
            const usersRef = db.collection('users');
            const q = usersRef.where('tradintaId', '==', identifier).limit(1);
            const snapshot = await q.get();
            if (snapshot.empty) throw new Error('User with this Tradinta ID not found.');
            userDocRef = snapshot.docs[0].ref;
        }
        
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) throw new Error('User profile not found.');

        const userData = userDoc.data();
        
        const ledgerQuery = db.collection('pointsLedgerEvents').where('user_id', '==', userDoc.id).orderBy('created_at', 'desc');
        const ledgerSnapshot = await ledgerQuery.get();
        
        const ledger = ledgerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalPoints = ledger.reduce((sum, event) => sum + event.points, 0);

        return {
            success: true,
            user: {
                id: userDoc.id,
                fullName: userData?.fullName,
                tradintaId: userData?.tradintaId,
                tradPointsStatus: userData?.tradPointsStatus || { isBanned: false },
                totalPoints,
                ledger
            }
        };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function banUserFromTradPoints({ userId, tradintaId, reason, ban }: { userId: string, tradintaId?: string, reason: string, ban: boolean }): Promise<{ success: boolean, message: string }> {
    try {
        const userRef = db.collection('users').doc(userId);
        
        await userRef.update({
            'tradPointsStatus.isBanned': ban,
            'tradPointsStatus.banReason': ban ? reason : FieldValue.delete(),
        });

        if (ban && tradintaId) {
            // Placeholder: Logic to void referral codes would go here.
        }
        
        return { success: true, message: `User has been successfully ${ban ? 'banned from' : 'reinstated to'} the TradPoints program.` };

    } catch (error: any) {
        console.error('Error updating TradPoints ban status:', error);
        return { success: false, message: error.message };
    }
}

export async function reversePointsByReason({
  userId,
  reasonCode,
  startDate,
  endDate,
  adminEmail,
}: {
  userId: string;
  reasonCode: string;
  startDate?: Date;
  endDate?: Date;
  adminEmail: string;
}): Promise<{ success: boolean; message: string; pointsReversed?: number }> {
    if (!userId || !reasonCode) {
        return { success: false, message: 'User ID and reason code are required.' };
    }

    try {
        let query = db.collection('pointsLedgerEvents')
            .where('user_id', '==', userId)
            .where('reason_code', '==', reasonCode)
            .where('action', '==', 'award'); // Only reverse awards

        if (startDate) {
            query = query.where('created_at', '>=', Timestamp.fromDate(startDate));
        }
        if (endDate) {
            query = query.where('created_at', '<=', Timestamp.fromDate(endDate));
        }

        const snapshot = await query.get();
        
        if (snapshot.empty) {
            return { success: true, message: 'No matching transactions found to reverse.', pointsReversed: 0 };
        }

        let totalPointsToReverse = 0;
        const reversedEventIds: string[] = [];

        snapshot.forEach(doc => {
            totalPointsToReverse += doc.data().points;
            reversedEventIds.push(doc.id);
        });

        if (totalPointsToReverse <= 0) {
             return { success: true, message: 'No points to reverse.', pointsReversed: 0 };
        }

        // Create a single reversal event
        const eventRef = db.collection('pointsLedgerEvents').doc();
        const reversalPayload = {
            event_id: eventRef.id,
            user_id: userId,
            points: -totalPointsToReverse, // Negative value
            action: 'reversal',
            reason_code: 'REVERSAL_MANUAL',
            metadata: {
                reversed_reason: reasonCode,
                reversed_event_ids: reversedEventIds,
                start_date: startDate?.toISOString() || null,
                end_date: endDate?.toISOString() || null,
                admin_user: adminEmail,
            },
            timestamp: new Date().toISOString(),
        };
        const hash = createHash('sha256').update(JSON.stringify(reversalPayload)).digest('hex');

        await eventRef.set({
            ...reversalPayload,
            created_at: FieldValue.serverTimestamp(),
            event_hash: hash,
            issued_by: 'admin',
        });

        return { success: true, message: `Successfully reversed ${totalPointsToReverse} points.`, pointsReversed: totalPointsToReverse };

    } catch (error: any) {
        console.error("Error reversing points:", error);
        return { success: false, message: error.message };
    }
}
