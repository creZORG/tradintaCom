
'use server';

/**
 * @fileoverview Service for fetching manufacturer (seller) data.
 * This service provides information relevant to ranking and trust, such
 * as verification status and active marketing plans.
 */

import { getDb } from '@/lib/firebase-admin';
import type { Manufacturer } from '@/lib/definitions';
import { Timestamp } from 'firebase-admin/firestore';


type MarketingPlan = {
    id: string;
    name: string;
    features: string[];
}

type AdSlot = {
    id: string;
    type: 'product' | 'manufacturer';
    pinnedEntities: {id: string}[]; // Changed to array of objects
    expiresAt?: Timestamp;
};

// Helper function to serialize Firestore Timestamps
function serializeData<T>(data: T): T {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    const serialized: { [key: string]: any } = {};
    for (const key in data) {
        const value = (data as any)[key];
        if (value instanceof Timestamp) {
            serialized[key] = value.toDate().toISOString();
        } else if (Array.isArray(value)) {
            serialized[key] = value.map(item => serializeData(item));
        } else if (value && typeof value === 'object' && !('__memo' in value) ) { // Check for React memoized objects
            serialized[key] = serializeData(value);
        } else {
            serialized[key] = value;
        }
    }
    return serialized as T;
}


/**
 * Fetches a single manufacturer's profile by their user ID.
 * @param sellerId The Firebase UID of the manufacturer.
 * @returns A Manufacturer object or null if not found.
 */
export async function getSellerById(sellerId: string): Promise<Manufacturer | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const docRef = db.collection('manufacturers').doc(sellerId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }
    
    const data = { id: docSnap.id, ...docSnap.data() } as Manufacturer;
    return serializeData(data);
  } catch (error) {
    console.error(`Error fetching seller by ID (${sellerId}):`, error);
    return null;
  }
}

/**
 * Fetches multiple manufacturer profiles by their user IDs.
 * This is more efficient than fetching them one by one.
 * @param sellerIds An array of Firebase UIDs of the manufacturers. If empty, fetches all sellers.
 * @returns A Map of sellerId to Manufacturer object.
 */
export async function getSellersByIds(sellerIds: string[]): Promise<Map<string, Manufacturer>> {
  const db = await getDb();
  if (!db) return new Map();
  const sellerMap = new Map<string, Manufacturer>();
  
  try {
    let querySnapshot;
    if (sellerIds.length > 0) {
      // Firestore's `in` query is limited to 30 items per query.
      // In a production system, we'd need to batch these requests.
      const uniqueIds = [...new Set(sellerIds)];
      if (uniqueIds.length > 0) {
        querySnapshot = await db.collection('manufacturers').where('__name__', 'in', uniqueIds).get();
      } else {
        return sellerMap;
      }
    } else {
      // If no IDs are provided, fetch all manufacturers.
      querySnapshot = await db.collection('manufacturers').get();
    }

    querySnapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() } as Manufacturer;
      sellerMap.set(doc.id, serializeData(data));
    });

    return sellerMap;
  } catch (error) {
    console.error(`Error fetching sellers by IDs:`, error);
    return sellerMap; // Return what we have
  }
}


/**
 * Fetches the active marketing plan for a given seller.
 * @param sellerId The Firebase UID of the manufacturer.
 * @returns The marketing plan data or null.
 */
export async function getActiveMarketingPlan(sellerId: string): Promise<MarketingPlan | null> {
    const db = await getDb();
    if (!db) return null;
    try {
        const sellerDoc = await db.collection('manufacturers').doc(sellerId).get();
        if (!sellerDoc.exists) return null;

        const sellerData = sellerDoc.data() as Manufacturer;
        const planId = sellerData.marketingPlanId;
        const planExpiresAt = sellerData.planExpiresAt as Timestamp | undefined;

        if (!planId) return null;
        
        // Check if the plan has expired
        if (planExpiresAt && planExpiresAt.toDate() < new Date()) {
            return null;
        }
        
        const planDoc = await db.collection('marketingPlans').doc(planId).get();
        if (!planDoc.exists) return null;

        return planDoc.data() as MarketingPlan;

    } catch (error) {
        console.error(`Error fetching active marketing plan for seller ${sellerId}:`, error);
        return null;
    }
}


/**
 * Fetches all manual ad slot overrides from Firestore.
 * @returns An array of AdSlot objects.
 */
export async function getAdSlots(): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];
    try {
        const snapshot = await db.collection('adSlots').get();
        if (snapshot.empty) {
            return [];
        }
        const now = new Date();
        // Filter out expired slots and serialize the data
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((slot: any) => !slot.expiresAt || slot.expiresAt.toDate() > now)
            .map(slot => serializeData(slot));
    } catch (error) {
        console.error("Error fetching ad slots:", error);
        return [];
    }
}
