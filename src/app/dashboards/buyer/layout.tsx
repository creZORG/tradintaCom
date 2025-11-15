
'use client';

import * as React from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PermissionDenied } from '@/components/ui/permission-denied';
import { SuspendedAccountOverlay } from '@/components/suspended-account-overlay';

type UserProfile = {
  tradPointsStatus?: {
    isBanned: boolean;
    banReason: string;
  };
};

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userDocRef);

  const isLoading = isUserLoading || isLoadingProfile;

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying account status...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  if (userProfile?.tradPointsStatus?.isBanned) {
      return <SuspendedAccountOverlay reason={userProfile.tradPointsStatus.banReason || 'Violation of platform policies.'} />
  }

  return <>{children}</>;
}
