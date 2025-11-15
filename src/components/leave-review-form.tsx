
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Product } from '@/lib/definitions';
import { nanoid } from 'nanoid';
import { awardPoints } from '@/lib/points';


export function LeaveReviewForm({ product, onReviewSubmit }: { product: Product; onReviewSubmit?: () => void; }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!user) {
    return (
      <div className="text-center p-4 border rounded-lg bg-muted/50">
        <p>
          <a href="/login" className="font-bold text-primary underline">Log in</a> to leave a review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: 'Please select a star rating.', variant: 'destructive' });
      return;
    }
    if (!comment.trim()) {
      toast({ title: 'Please write a comment.', variant: 'destructive' });
      return;
    }
    if (!firestore) return;

    setIsSubmitting(true);
    try {
      const reviewData = {
        id: nanoid(),
        productId: product.id,
        productName: product.name,
        manufacturerId: product.manufacturerId,
        buyerId: user.uid,
        buyerName: user.displayName || 'Anonymous',
        buyerAvatar: user.photoURL || '',
        rating,
        comment,
        createdAt: serverTimestamp(),
        status: 'approved', // Auto-approved for now
      };
      
      const reviewRef = await addDocumentNonBlocking(collection(firestore, 'reviews'), reviewData);
      
      const pointsConfigRef = doc(firestore, 'platformSettings', 'config');
      const pointsConfigSnap = await getDoc(pointsConfigRef);
      const pointsConfig = pointsConfigSnap.data()?.pointsConfig || {};
      const reviewPoints = pointsConfig.buyerReviewPoints || 15;
      
      // We are not awaiting awardPoints to make the UI feel faster
      if (reviewPoints > 0 && firestore) {
          awardPoints(firestore, user.uid, reviewPoints, 'REVIEW_SUBMITTED', { productId: product.id, reviewId: reviewRef.id });
      }

      // Trigger the ratings recalculation API
      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reviewId: reviewRef.id,
            productId: product.id,
            manufacturerId: product.manufacturerId,
            rating: rating
        })
      });


      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
      });
      setRating(0);
      setComment('');
      
      if (onReviewSubmit) {
          onReviewSubmit();
      }

    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="font-medium mb-2">Your Rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-8 h-8 cursor-pointer',
                (hoverRating || rating) >= star
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              )}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>
      <Textarea
        placeholder="Share your experience with this product..."
        className="min-h-[120px]"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Submit Review
      </Button>
    </form>
  );
}
