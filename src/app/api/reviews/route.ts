
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { awardPoints } from '@/lib/points';

export async function POST(request: NextRequest) {
  const { reviewId, productId, manufacturerId, rating } = await request.json();
  const db = await getDb();

  if (!reviewId || !productId || !manufacturerId || rating === undefined) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  try {
    const productRef = db.collection('manufacturers').doc(manufacturerId).collection('products').doc(productId);

    // ---- Part 1: Update Product's Average Rating in a Transaction ----
    await db.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists) {
        throw new Error('Product not found!');
      }

      const productData = productDoc.data();
      const currentReviewCount = productData?.reviewCount || 0;
      const currentAvgRating = productData?.rating || 0;

      const newReviewCount = currentReviewCount + 1;
      // Using a more robust formula to avoid floating point issues
      const newTotalRating = (currentAvgRating * currentReviewCount) + rating;
      const newAvgRating = newTotalRating / newReviewCount;
      
      transaction.update(productRef, {
        reviewCount: newReviewCount,
        rating: newAvgRating
      });
    });
    console.log(`Updated product ${productId} rating successfully.`);

    // ---- Part 2: Award points to seller for 5-star review (if applicable) ----
    if (rating === 5) {
        const pointsConfigSnap = await db.collection('platformSettings').doc('config').get();
        const pointsConfig = pointsConfigSnap.data()?.pointsConfig || {};
        const seller5StarPoints = pointsConfig.sellerFiveStarReviewPoints || 10;
        if (seller5StarPoints > 0) {
            await awardPoints(db, manufacturerId, seller5StarPoints, 'FIVE_STAR_REVIEW_RECEIVED', { productId, reviewId });
        }
    }
    
    // The manufacturer-level rating update has been removed to fix the infinite loop.
    // This can be re-implemented later with a more robust background job.

    return NextResponse.json({ success: true, message: 'Ratings updated successfully.' });

  } catch (error: any) {
    console.error('Error updating ratings:', error);
    return NextResponse.json({ error: 'Failed to update ratings.', details: error.message }, { status: 500 });
  }
}
