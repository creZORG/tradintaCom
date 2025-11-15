
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OverviewTab } from '@/components/tradinta-direct-admin/OverviewTab';
import { OrdersTab } from '@/components/tradinta-direct-admin/OrdersTab';
import { ProductsTab } from '@/components/tradinta-direct-admin/ProductsTab';
import { ShipmentsTab } from '@/components/tradinta-direct-admin/ShipmentsTab';
import { ReturnsTab } from '@/components/tradinta-direct-admin/ReturnsTab';


function TradintaDirectAdminDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const renderContent = () => {
      switch(activeTab) {
          case 'orders': return <OrdersTab />;
          case 'products': return <ProductsTab />;
          case 'shipments': return <ShipmentsTab />;
          case 'returns': return <ReturnsTab />;
          case 'overview':
          default:
              return <OverviewTab />;
      }
  }

  return (
        <div className="space-y-6">
            {renderContent()}
        </div>
    );
}

export default function TradintaDirectAdminDashboard() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TradintaDirectAdminDashboardContent />
        </Suspense>
    )
}
