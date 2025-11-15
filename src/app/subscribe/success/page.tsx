
import * as React from 'react';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SubscriptionSuccessContent } from '@/components/subscribe/SubscriptionSuccessContent';


export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
