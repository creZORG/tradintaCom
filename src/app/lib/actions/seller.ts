
'use server';

import { getDb } from '@/lib/firebase-admin';

/**
 * Deletes all products within a seller's 'products' subcollection.
 * This is a destructive and irreversible server-side action.
 *
 * @param sellerId The Firebase UID of the manufacturer whose products are to be deleted.
 * @returns An object indicating success, a message, and the count of deleted products.
 */
export async function deleteSellerContent(
  sellerId: string
): Promise<{ success: boolean; message: string; deletedCount?: number }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database service is not available.' };
  }
  if (!sellerId) {
    return { success: false, message: 'Seller ID is missing.' };
  }

  try {
    const productsRef = db.collection('manufacturers').doc(sellerId).collection('products');
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
      return { success: true, message: 'No products found to delete.', deletedCount: 0 };
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true, message: 'All products for the seller have been deleted.', deletedCount: snapshot.size };

  } catch (error: any) {
    console.error(`Error deleting content for seller ${sellerId}:`, error);
    return { success: false, message: `Failed to delete content: ${error.message}` };
  }
}
