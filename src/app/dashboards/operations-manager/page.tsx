
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ApprovalsTab } from '@/components/operations/approvals-tab';
import { DisputesTab } from '@/components/operations/disputes-tab';
import { ActivityLogTab } from '@/components/operations/activity-log-tab';
import { PlatformHealthTab } from '@/components/operations/platform-health-tab';
import { OverviewTab } from '@/components/operations/overview-tab';

function OperationsDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const renderContent = () => {
    switch (activeTab) {
      case 'approvals':
        return <ApprovalsTab />;
      case 'disputes':
        return <DisputesTab />;
      case 'activity':
        return <ActivityLogTab />;
      case 'platform-health':
        return <PlatformHealthTab />;
      case 'overview':
      default:
        return <OverviewTab />;
    }
  };

  return <div className="space-y-6">{renderContent()}</div>;
}

export default function OperationsManagerDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <OperationsDashboardContent />
    </Suspense>
  )
}
