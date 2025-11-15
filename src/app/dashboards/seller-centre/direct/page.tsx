
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OverviewTab } from '@/components/tradinta-direct-admin/OverviewTab';
import { PendingSetupTab } from '@/components/tradinta-direct/PendingSetupTab';
import { LiveProductsTab } from '@/components/tradinta-direct/LiveProductsTab';
import { MarketingTab } from '@/components/tradinta-direct/MarketingTab';

function TradintaDirectDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const renderContent = () => {
    switch (activeTab) {
      case 'pending':
        return <PendingSetupTab />;
      case 'live':
        return <LiveProductsTab />;
      case 'marketing':
        return <MarketingTab />;
      case 'overview':
      default:
        return <OverviewTab />;
    }
  };

  return <div className="space-y-6">{renderContent()}</div>;
}

export default function TradintaDirectDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <TradintaDirectDashboardContent />
    </Suspense>
  );
}
