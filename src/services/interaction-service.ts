
'use server';

/**
 * @fileoverview Service for fetching and recording user-specific interaction data.
 * This service answers questions about a user's personal relationship with
 * products and sellers, and records new interactions.
 */

import { getDb } from '@/lib/firebase-admin';
import { serverTimestamp } from 'firebase-admin/firestore';
import { headers } from 'next/headers';


/**
 * Fetches the IDs of all manufacturers a user is following.
 * @param userId The Firebase UID of the user.
 * @returns An array of manufacturer IDs.
 */
export async function getFollowedSellerIds(userId: string): Promise<string[]> {
  const db = await getDb();
  if (!userId || !db) {
    return [];
  }
  
  try {
    const snapshot = await db.collection(`users/${userId}/following`).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error(`Error fetching followed sellers for user (${userId}):`, error);
    return [];
  }
}

/**
 * Fetches the product IDs in a user's wishlist.
 * @param userId The Firebase UID of the user.
 * @returns An array of product IDs.
 */
export async function getWishlistedProductIds(userId: string): Promise<string[]> {
    const db = await getDb();
    if (!userId || !db) {
        return [];
    }
    try {
        const snapshot = await db.collection(`users/${userId}/wishlist`).get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error(`Error fetching wishlist for user (${userId}):`, error);
        return [];
    }
}

/**
 * Logs a view event for a manufacturer's profile.
 * @param manufacturerId The ID of the manufacturer whose profile was viewed.
 * @param userId The ID of the user viewing the profile, or null/undefined for anonymous users.
 */
export async function logProfileView(manufacturerId: string, userId?: string | null) {
  const db = await getDb();
  if (!db || !manufacturerId) return;

  const headerPayload = headers();
  
  try {
    const viewData = {
      timestamp: serverTimestamp(),
      userId: userId || 'anonymous',
      userAgent: headerPayload.get('user-agent') || 'unknown',
    };
    
    db.collection('manufacturers').doc(manufacturerId).collection('profileViews').add(viewData);

  } catch (error) {
    console.error(`Error logging profile view for manufacturer ${manufacturerId}:`, error);
  }
}

/**
 * Logs the traffic source for a visit to a seller's page.
 * @param sellerId The ID of the manufacturer receiving the traffic.
 * @param source The determined traffic source (e.g., 'Google', 'Direct', 'Facebook').
 */
export async function logTrafficSource(sellerId: string, source: string) {
  const db = await getDb();
  if (!db || !sellerId || !source) return;

  try {
    const logData = {
      source,
      timestamp: serverTimestamp(),
    };
    // This is a fire-and-forget operation
    db.collection('manufacturers').doc(sellerId).collection('trafficSources').add(logData);
  } catch (error) {
    console.error(`Error logging traffic source for seller ${sellerId}:`, error);
  }
}


/**
 * Fetches a user's recent search history.
 * @param userId The Firebase UID of the user.
 * @returns An array of recent search query strings.
 */
export async function getRecentSearches(userId: string): Promise<string[]> {
    return [];
}

/**
 * Fetches a user's recent product view history.
 * This would power the "decaying boost" for recently viewed items.
 * @param userId The Firebase UID of the user.
 * @returns An array of objects containing productId and view timestamp.
 */
export async function getProductViewHistory(userId: string): Promise<{productId: string, viewedAt: Date}[]> {
    return [];
}

/**
 * Gets the total number of profile views for a given seller.
 * @param sellerId The ID of the manufacturer.
 * @returns The total number of documents in the 'profileViews' subcollection.
 */
export async function getShopProfileViews(sellerId: string): Promise<number> {
  const db = await getDb();
  if (!db || !sellerId) return 0;
  try {
    const snapshot = await db.collection('manufacturers').doc(sellerId).collection('profileViews').get();
    return snapshot.size;
  } catch (error) {
    console.error(`Error fetching profile views for seller ${sellerId}:`, error);
    return 0;
  }
}
