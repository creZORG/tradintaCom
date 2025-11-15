
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logFeatureUsage } from '@/lib/analytics';

interface WishlistButtonProps {
  productId: string;
  manufacturerId: string;
}

export function WishlistButton({ productId, manufacturerId }: WishlistButtonProps) {
  const { user, role } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    const checkWishlistStatus = async () => {
      setIsLoading(true);
      const wishlistRef = doc(firestore, `users/${user.uid}/wishlist`, productId);
      const docSnap = await getDoc(wishlistRef);
      setIsInWishlist(docSnap.exists());
      setIsLoading(false);
    };
    checkWishlistStatus();
  }, [user, firestore, productId]);

  const handleToggleWishlist = async () => {
    if (!user || !firestore || !role) {
      toast({ title: 'Please log in to use the wishlist.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const wishlistRef = doc(firestore, `users/${user.uid}/wishlist`, productId);
    const productRef = doc(firestore, 'manufacturers', manufacturerId, 'products', productId);

    try {
      if (isInWishlist) {
        // Unfollow logic
        await deleteDoc(wishlistRef);
        await updateDoc(productRef, { wishlistCount: increment(-1) });
        setIsInWishlist(false);
        toast({ title: 'Removed from wishlist' });
        logFeatureUsage({ feature: 'wishlist:remove', userId: user.uid, userRole: role, metadata: { productId } });
      } else {
        // Follow logic
        await setDoc(wishlistRef, { productId: productId, addedAt: serverTimestamp() });
        await updateDoc(productRef, { wishlistCount: increment(1) });
        setIsInWishlist(true);
        toast({ title: 'Added to wishlist!' });
        logFeatureUsage({ feature: 'wishlist:add', userId: user.uid, userRole: role, metadata: { productId } });
      }
    } catch (error: any) {
      // If one of the operations fails, we should ideally revert the other.
      // For now, we'll just log the error and hope for the best in a prototype.
      console.error("Wishlist toggle error:", error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
        <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
            <Heart className="mr-2 h-4 w-4"/> Wishlist
        </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      onClick={handleToggleWishlist}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("mr-2 h-4 w-4", isInWishlist && 'fill-red-500 text-red-500')} />
      )}
      {isInWishlist ? 'In Wishlist' : 'Wishlist'}
    </Button>
  );
}
