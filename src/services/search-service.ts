
'use server';

import { getDb } from '@/lib/firebase-admin';
import type { Product, Manufacturer } from '@/lib/definitions';
import { Timestamp } from 'firebase-admin/firestore';
import { getRankedProducts } from './DiscoveryEngine';

interface SearchResults {
    products: Product[];
    manufacturers: Manufacturer[];
}

// Helper to sanitize data for client-side usage (e.g., converting Timestamps)
function sanitizeForClient(docData: any): any {
    if (!docData) return null;
    const sanitized: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            sanitized[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeForClient(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}


/**
 * Performs a search across products and manufacturers.
 * This is the central server-side search function.
 * 
 * @param queryText The search term entered by the user.
 * @returns A promise that resolves to an object containing arrays of products and manufacturers.
 */
export async function performSearch(queryText: string): Promise<SearchResults> {
    const db = await getDb();
    if (!db) {
        console.error("Firestore not available in search-service.");
        return { products: [], manufacturers: [] };
    }

    const cleanQuery = queryText.toLowerCase().trim();
    if (!cleanQuery) {
        return { products: [], manufacturers: [] };
    }

    try {
        // Use the Discovery Engine for product search, which is now more efficient.
        const rankedData = await getRankedProducts({ searchQuery: cleanQuery });
        const productResults = rankedData.products;

        // Manufacturer query remains the same.
        const manufacturerQuery = db.collection('manufacturers')
            .where('searchKeywords', 'array-contains', cleanQuery)
            .limit(10);
            
        const manufacturerSnapshots = await manufacturerQuery.get();

        const manufacturerResults = manufacturerSnapshots.docs.map(doc => {
            return sanitizeForClient({
                id: doc.id,
                ...doc.data()
            } as Manufacturer);
        });

        return { products: productResults, manufacturers: manufacturerResults };

    } catch (error) {
        console.error("Error performing search:", error);
        return { products: [], manufacturers: [] };
    }
}
