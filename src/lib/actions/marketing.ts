
'use server';

import { getDb } from '@/lib/firebase-admin';
import { FieldValue, doc } from 'firebase-admin/firestore';

export async function validatePromoCode(
  code: string,
  sellerId: string,
  subtotal: number
): Promise<{ success: boolean; discountAmount: number; message: string }> {
  const db = await getDb();
  
  try {
    const campaignsRef = db.collection('manufacturers').doc(sellerId).collection('marketingCampaigns');
    const q = campaignsRef.where('promoCode', '==', code).where('status', '==', 'active').limit(1);

    const snapshot = await q.get();

    if (snapshot.empty) {
      return { success: false, discountAmount: 0, message: 'This promo code is not valid for this seller or has expired.' };
    }

    const campaignDoc = snapshot.docs[0];
    const campaign = campaignDoc.data();

    if (campaign.expiresAt && campaign.expiresAt.toDate() < new Date()) {
       await campaignDoc.ref.update({ status: 'expired' });
       return { success: false, discountAmount: 0, message: 'This promo code has expired.' };
    }
    
    let discountAmount = 0;
    if (campaign.discountType === 'percentage') {
        discountAmount = subtotal * (campaign.discountValue / 100);
    } else if (campaign.discountType === 'fixed') {
        discountAmount = campaign.discountValue;
    }

    // Increment usage count - fire and forget
    campaignDoc.ref.update({ usageCount: FieldValue.increment(1) });

    return { success: true, discountAmount, message: 'Promo code applied successfully!' };

  } catch (error: any) {
    console.error("Error validating promo code:", error);
    return { success: false, discountAmount: 0, message: 'An internal error occurred. Please try again.' };
  }
}


export async function removeEntityFromAdSlot(slotId: string, entityId: string): Promise<{ success: boolean; message?: string; }> {
    const db = await getDb();
    if (!db) {
        return { success: false, message: 'Database service is not available.' };
    }

    const slotRef = doc(db, 'adSlots', slotId);

    try {
        const slotDoc = await slotRef.get();
        if (!slotDoc.exists()) {
            return { success: false, message: 'Ad slot not found.' };
        }

        const currentEntities = slotDoc.data()?.pinnedEntities || [];
        const updatedEntities = currentEntities.filter((entity: any) => entity.id !== entityId);

        await slotRef.update({ pinnedEntities: updatedEntities });
        
        return { success: true };

    } catch (error: any) {
        console.error("Error removing entity from ad slot:", error);
        return { success: false, message: error.message };
    }
}
