
'use server';

/**
 * @fileoverview Service for fetching administrative and moderation data.
 * This service provides information on content status, such as shadow bans,
 * suspensions, or unresolved reports, which are used to demote or hide items.
 */

import { getDb } from '@/lib/firebase-admin';


/**
 * Checks the moderation status of a specific product.
 * In a real system, this would look for flags set by administrators.
 * @param productId The ID of the product to check.
 * @returns An object indicating if the product is demoted (shadow-banned).
 */
export async function getProductModerationStatus(productId: string): Promise<{ isDemoted: boolean }> {
    // This is a placeholder. A real implementation would check a field on the
    // product document, e.g., `moderation.status === 'demoted'`.
    return { isDemoted: false };
}

/**
 * Checks if a seller is currently suspended.
 * This is a hard filter; products from suspended sellers should not be shown.
 * @param sellerId The Firebase UID of the seller.
 * @returns True if the seller is suspended, false otherwise.
 */
export async function isSellerSuspended(sellerId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true; // Fail safe
  try {
    const docRef = db.collection('manufacturers').doc(sellerId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return true; // If seller doc doesn't exist, treat as suspended.
    }

    const data = docSnap.data();
    return data?.suspensionDetails?.isSuspended === true;
  } catch (error) {
    console.error(`Error checking seller suspension status for (${sellerId}):`, error);
    return true; // Fail safe by assuming suspended on error.
  }
}

/**
 * Counts the number of unresolved reports for a given product or seller.
 * A high number could be used by the ranking algorithm to demote content.
 * @param referenceId The ID of the product or seller.
 * @returns The number of 'new' or 'under_review' reports.
 */
export async function countUnresolvedReports(referenceId: string): Promise<number> {
    const db = await getDb();
    if (!db || !referenceId) return 0; // Guard against undefined referenceId
    try {
        const query = db.collection('reports')
            .where('referenceId', '==', referenceId)
            .where('status', 'in', ['new', 'under_review']);
        
        const snapshot = await query.get();
        return snapshot.size;
    } catch (error) {
        console.error(`Error counting unresolved reports for (${referenceId}):`, error);
        return 0;
    }
}
