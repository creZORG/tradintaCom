
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { TradCoinAirdropDashboardContent } from '@/components/tradcoin-admin/tradcoin-dashboard-client';

// This page now correctly wraps the client-only component in a Suspense boundary
// to match the structure Next.js expects, resolving the hydration error.
export default function TradPointsPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <TradCoinAirdropDashboardContent />
    </React.Suspense>
  );
}
