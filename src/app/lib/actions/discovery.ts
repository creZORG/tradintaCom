
'use server';

import { getDb } from '@/lib/firebase-admin';
import type { Product, Manufacturer } from '@/lib/definitions';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';
import { collection, query, where, limit, getDocs, or_ } from 'firebase/firestore';


/**
 * Server action to look up a product or manufacturer by name or ID.
 * This keeps the data-fetching and filtering logic on the server.
 * @param entityType - The type of entity to look for ('product' or 'manufacturer').
 * @param searchQuery - The name or ID to search for.
 * @returns The found entity or null.
 */
export async function lookupEntity(
  entityType: 'product' | 'manufacturer',
  searchQuery: string
): Promise<ProductWithRanking | null> {
  const db = await getDb();
  if (!db) return null;
  
  const lowerQuery = searchQuery.toLowerCase();

  try {
    if (entityType === 'product') {
        // Since product search is more complex, we can use the discovery engine's filtering
        const rankedData = await getRankedProducts({ searchQuery: lowerQuery, limit: 20 });

        if (!rankedData || !Array.isArray(rankedData.products)) {
            console.error('[lookupEntity] getRankedProducts did not return a valid products array.');
            return null;
        }
        
        const foundProduct = rankedData.products.find(
            (p) =>
                p.id.toLowerCase() === lowerQuery ||
                p.name.toLowerCase().includes(lowerQuery)
        );

        return foundProduct || null;

    } else { // entityType is 'manufacturer'
        const manufQuery = query(
            collection(db, 'manufacturers'),
            or_(
                where('shopId', '==', lowerQuery),
                where('slug', '==', lowerQuery),
                where('id', '==', searchQuery),
                where('tradintaId', '==', searchQuery) // Use original case-sensitive query for tradintaId
            ),
            limit(1)
        );
        const manufSnapshot = await getDocs(manufQuery);

        if (!manufSnapshot.empty) {
            const doc = manufSnapshot.docs[0];
            const seller = { id: doc.id, ...doc.data() } as Manufacturer;
            return {
                id: seller.id,
                name: seller.shopName || 'Unnamed Shop',
                imageUrl: seller.logoUrl,
                tradRank: seller.rating || 0,
                moderation: (seller as any).moderation,
                manufacturerId: seller.id,
                slug: seller.slug,
                shopId: seller.shopId,
            } as ProductWithRanking;
        }
        
        // Fallback to search by keywords if no ID match
        const nameQuery = query(
            collection(db, 'manufacturers'),
            where('searchKeywords', 'array-contains', lowerQuery),
            limit(1)
        );
        const nameSnapshot = await getDocs(nameQuery);
        if (!nameSnapshot.empty) {
            const doc = nameSnapshot.docs[0];
            const seller = { id: doc.id, ...doc.data() } as Manufacturer;
             return {
                id: seller.id,
                name: seller.shopName || 'Unnamed Shop',
                imageUrl: seller.logoUrl,
                tradRank: seller.rating || 0,
                moderation: (seller as any).moderation,
                manufacturerId: seller.id,
                slug: seller.slug,
                shopId: seller.shopId,
            } as ProductWithRanking;
        }
      
        return null;
    }
  } catch (error) {
      console.error("[lookupEntity] An error occurred:", error);
      return null;
  }
}
