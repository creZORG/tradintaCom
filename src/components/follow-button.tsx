
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  targetId: string;
  targetType: 'manufacturer' | 'partner';
}

export function FollowButton({ targetId, targetType }: FollowButtonProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    const checkFollowingStatus = async () => {
      const followRef = doc(firestore, `users/${user.uid}/following`, targetId);
      const docSnap = await getDoc(followRef);
      setIsFollowing(docSnap.exists());
      setIsLoading(false);
    };
    checkFollowingStatus();
  }, [user, firestore, targetId]);

  const handleFollow = async () => {
    if (!user || !firestore) {
      toast({ title: 'Please log in to follow.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const followingRef = doc(firestore, `users/${user.uid}/following`, targetId);
    const followerRef = doc(firestore, `${targetType}s`, targetId, 'followers', user.uid);

    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(followingRef);
        await deleteDoc(followerRef);
        setIsFollowing(false);
        toast({ title: 'Unfollowed' });
      } else {
        // Follow
        await setDoc(followingRef, { type: targetType, followedAt: new Date() });
        await setDoc(followerRef, { userId: user.uid, followedAt: new Date() });
        setIsFollowing(true);
        toast({ title: 'Followed!' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    // Optionally render a disabled button or nothing for logged-out users
    return null;
  }

  if (user.uid === targetId) {
    // User cannot follow themselves
    return null;
  }
  
  if (isLoading) {
    return <Button variant="outline" size="sm" disabled><Loader2 className="w-4 h-4 animate-spin" /></Button>;
  }

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isFollowing ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
