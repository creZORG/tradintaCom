
'use client';

import * as React from 'react';
import { useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SuspendedShopOverlay } from '@/components/suspended-shop-overlay';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ApplyToBecomeManufacturer } from '@/components/apply-to-become-manufacturer';

type ManufacturerData = {
  suspensionDetails?: {
    isSuspended: boolean;
    reason: string;
    prohibitions: string[];
    publicDisclaimer: boolean;
  };
};

export default function SellerCentreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, role } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const manufacturerDocRef = useMemoFirebase(() => {
    // Only fetch manufacturer-specific data for actual manufacturers
    if (!user || !firestore || (role !== 'manufacturer' && role !== 'super-admin')) return null;
    // Super-admins might view a seller's dashboard, so they need to be able to load this.
    // We assume the context (e.g., from URL) would provide the correct user.uid to view.
    // For this layout, it defaults to the logged-in user's UID.
    return doc(firestore, 'manufacturers', user.uid);
  }, [user, firestore, role]);

  const { data: manufacturer, isLoading: isLoadingManufacturer } =
    useDoc<ManufacturerData>(manufacturerDocRef);
    
  // The overall loading state depends on both user auth and potentially manufacturer data.
  const isLoading = isUserLoading || (role === 'manufacturer' && isLoadingManufacturer);

  React.useEffect(() => {
    // This effect handles the redirection after the initial auth check.
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
  
  // After loading, if there's still no user, we render nothing while the redirect happens.
  if (!user) {
      return null;
  }

  const isAuthorized = role === 'manufacturer' || role === 'super-admin';

  if (!isAuthorized) {
    // A logged-in user who is not a seller or super-admin is prompted to apply.
    return <ApplyToBecomeManufacturer />;
  }
  
  // Suspension checks should only apply to actual manufacturers
  if (role === 'manufacturer') {
    const isSuspended = manufacturer?.suspensionDetails?.isSuspended === true;
    const isBlockedFromDashboard =
      manufacturer?.suspensionDetails?.prohibitions?.includes(
        'block_dashboard_access'
      );
    const suspensionReason =
      manufacturer?.suspensionDetails?.reason || 'Violation of platform policies.';

    if (isSuspended && isBlockedFromDashboard) {
      return <SuspendedShopOverlay reason={suspensionReason} />;
    }
  }

  // If all checks pass, render the child page.
  return <>{children}</>;
}
