
import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { TradCoinAirdropDashboardContent } from '@/components/tradcoin-admin/tradcoin-dashboard-client';

export default function TradCoinAirdropDashboard() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TradCoinAirdropDashboardContent />
        </React.Suspense>
    )
}
