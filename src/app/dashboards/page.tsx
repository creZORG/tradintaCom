'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This is a temporary router. In the future, this will be a dashboard that
// allows users to select which dashboard they want to go to.
export default function DashboardRouterPage() {
  const { user, role, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      // Wait until we know the user's role
      return;
    }

    let path = '/dashboards/buyer'; // Default for buyers or un-roled users
    if (role === 'manufacturer') {
      path = '/dashboards/seller-centre';
    } else if (role === 'admin') {
      path = '/dashboards/admin';
    } else if (role === 'super-admin') {
      path = '/dashboards/super-admin';
    } else if (role === 'support') {
      path = '/dashboards/support';
    } else if (role === 'operations-manager') {
      path = '/dashboards/operations-manager';
    } else if (role === 'user-management') {
        path = '/dashboards/user-management';
    } else if (role === 'marketing-manager') {
        path = '/dashboards/marketing-manager';
    } else if (role === 'finance') {
        path = '/dashboards/finance';
    } else if (role === 'legal-compliance') {
        path = '/dashboards/legal-compliance';
    } else if (role === 'tradinta-direct-admin') {
        path = '/dashboards/tradinta-direct-admin';
    } else if (role === 'logistics') {
        path = '/dashboards/logistics';
    } else if (role === 'tradpay-admin') {
        path = '/dashboards/tradpay-admin';
    } else if (role === 'tradcoin-airdrop') {
        path = '/dashboards/tradcoin-admin';
    } else if (role === 'partner') {
        path = '/dashboards/growth-partner';
    } else if (role === 'distributor') {
        path = '/dashboards/distributor';
    }


    if (path) {
      router.replace(path);
    }
  }, [role, isUserLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirecting to your dashboard...</p>
    </div>
  );
}
