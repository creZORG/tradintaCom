
'use client';

import React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { setUserRoleClaim } from '@/app/lib/actions/auth';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Factory, ShieldCheck, ShoppingCart, Wallet, Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { generateSlug } from '@/lib/utils';

export function ApplyToBecomeManufacturer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = React.useState(false);

  const handleApply = async () => {
    if (!user || !firestore) return;

    setIsApplying(true);
    try {
      // 1. Change user role via server action
      const roleResult = await setUserRoleClaim(user.uid, 'manufacturer');
      if (!roleResult.success) {
        throw new Error(roleResult.message || 'Failed to update user role.');
      }

      // 2. Create the initial manufacturer document
      const manufacturerRef = doc(firestore, 'manufacturers', user.uid);
      const shopId = nanoid(10);
      const shopSlug = generateSlug(user.displayName || 'My Shop');
      
      const manufData = {
        ownerName: user.displayName,
        shopName: user.displayName || 'My Shop',
        email: user.email,
        registrationDate: serverTimestamp(),
        verificationStatus: 'Unsubmitted',
        shopId: shopId,
        slug: shopSlug,
      };

      await setDoc(manufacturerRef, manufData, { merge: true });
      
       // 3. Create the shop document
      const shopDocRef = doc(firestore, 'shops', shopId);
      await setDoc(shopDocRef, {
        id: shopId,
        name: user.displayName || 'My Shop',
        slug: shopSlug,
        description: `The official shop for ${user.displayName || 'My Shop'}.`,
        manufacturerId: user.uid,
      });

      toast({
        title: 'Application Started!',
        description:
          "You're now ready to set up your manufacturer profile. The page will reload.",
      });

      // Forcing a hard reload to ensure the new user role and claims are fetched
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({
        title: 'Application Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsApplying(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="max-w-lg text-center">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-2">
            <Factory className="w-12 h-12 text-primary" />
            Become a Manufacturer on Tradinta
          </CardTitle>
          <CardDescription>
            Join hundreds of verified manufacturers and expand your reach across
            Africa.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-left space-y-2">
          <p className="flex items-start">
            <ShieldCheck className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-1" />
            <span>List your products in our B2B marketplace.</span>
          </p>
          <p className="flex items-start">
            <ShoppingCart className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-1" />
            <span>
              Receive direct orders and quotation requests from verified buyers.
            </span>
          </p>
          <p className="flex items-start">
            <Wallet className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-1" />
            <span>Utilize secure payments with TradPay escrow.</span>
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleApply} disabled={isApplying}>
            {isApplying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isApplying ? 'Setting up your shop...' : 'Start Your Application'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    