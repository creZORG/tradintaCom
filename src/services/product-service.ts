
'use server';

/**
 * @fileoverview Service for fetching raw product data from Firestore.
 * This service is not concerned with ranking or business logic; its sole
 * purpose is to retrieve product documents.
 */

import { getDb } from '@/lib/firebase-admin';
import type { Product, Manufacturer } from '@/lib/definitions';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as SellerService from './seller-service';
import { getRankedProducts } from './DiscoveryEngine';

// Helper to safely serialize Firestore Timestamps to ISO strings
function serializeTimestamps(docData: any) {
    if (!docData) return docData;
    const sanitizedData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            sanitizedData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively process nested objects, useful for variants etc.
            sanitizedData[key] = serializeTimestamps(value);
        }
        else {
            sanitizedData[key] = value;
        }
    }
    return sanitizedData;
}


export async function getAllProducts(): Promise<(Product & { manufacturerId: string })[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    // This now queries the much faster root collection.
    const productsSnapshot = await db.collection('products').where('status', '==', 'published').get();
    
    if (productsSnapshot.empty) {
      return [];
    }

    const products = productsSnapshot.docs.map(doc => {
        const productData = doc.data() as Product;
        return {
            ...productData,
            id: doc.id,
            manufacturerId: productData.manufacturerId,
        };
    });
    
    return products as (Product & { manufacturerId: string })[];

  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}

export async function getProductById(productId: string): Promise<(Product & { manufacturerId: string, manufacturerSlug?: string }) | null> {
    const db = await getDb();
    if (!db) return null;
    try {
        const productRef = db.collection('products').doc(productId);
        const docSnap = await productRef.get();
        
        if (!docSnap.exists) {
            return null;
        }
        const productData = docSnap.data() as any;

        const manufacturerRef = db.collection('manufacturers').doc(productData.manufacturerId);
        const manufacturerSnap = await manufacturerRef.get();
        if (!manufacturerSnap.exists) return null;
        const manufacturerData = manufacturerSnap.data();

        return {
            ...productData,
            id: productData.id || docSnap.id,
            manufacturerId: manufacturerRef.id,
            manufacturerSlug: manufacturerData?.slug,
        } as Product & { manufacturerId: string, manufacturerSlug?: string };

    } catch (error) {
        console.error(`Error fetching product by ID (${productId}):`, error);
        return null;
    }
}

export async function getProductsByIds(productIds: string[]): Promise<Product[]> {
    const db = await getDb();
    if (!db || !productIds || productIds.length === 0) {
        return [];
    }
    
    const uniqueIds = [...new Set(productIds)].filter(Boolean).slice(0, 30);
    
    if (uniqueIds.length === 0) {
        return [];
    }

    try {
        // This query is now on the root /products collection and is much more efficient.
        const productsQuery = db.collection('products').where('id', 'in', uniqueIds);
        const snapshot = await productsQuery.get();
        
        if (snapshot.empty) {
            return [];
        }

        const rankedData = await getRankedProducts({ productIds: uniqueIds });

        const products = await Promise.all(snapshot.docs.map(async (doc) => {
            const productData = doc.data();
            const manufacturerRef = db.collection('manufacturers').doc(productData.manufacturerId);
            if (!manufacturerRef) return null;

            const manufacturerSnap = await manufacturerRef.get();
            if (!manufacturerSnap.exists) return null;

            const manufacturerData = manufacturerSnap.data() as Manufacturer;
            const rankedProduct = rankedData.products.find(p => p.id === doc.id);
            
            const combinedData = {
                ...productData,
                id: productData.id || doc.id,
                manufacturerId: manufacturerRef.id,
                manufacturerName: manufacturerData?.shopName,
                isVerified: manufacturerData?.verificationStatus === 'Verified',
                manufacturerLocation: manufacturerData?.location,
                manufacturerSlug: manufacturerData?.slug,
                shopId: manufacturerData?.shopId,
                leadTime: manufacturerData?.leadTime,
                moq: manufacturerData?.moq,
                tradRank: rankedProduct?.tradRank || 0,
                sales: Math.floor((rankedProduct?.tradRank || 0) / 10), // Mock sales data based on rank
            };

            // Serialize the combined data to convert Timestamps before returning
            return serializeTimestamps(combinedData) as Product;
        }));

        return products.filter((p): p is Product => p !== null);

    } catch (error) {
        console.error("Error fetching products by IDs:", error);
        return [];
    }
}

export async function getTotalProductViewsForSeller(sellerId: string): Promise<number> {
    const db = await getDb();
    if (!db) return 0;
    try {
        const productsRef = db.collection('manufacturers').doc(sellerId).collection('products');
        const snapshot = await productsRef.get();

        if (snapshot.empty) {
            return 0;
        }

        let totalViews = 0;
        snapshot.docs.forEach(doc => {
            totalViews += doc.data().viewCount || 0;
        });

        return totalViews;
    } catch (error) {
        console.error(`Error getting total product views for seller ${sellerId}:`, error);
        return 0;
    }
}
