
'use client';

import { Logo } from '@/components/logo';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface SuspendedAccountOverlayProps {
  reason: string;
}

export function SuspendedAccountOverlay({ reason }: SuspendedAccountOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-full max-w-md">
        <Logo className="w-40 mx-auto mb-8" />
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold font-headline text-destructive mb-2">
          Account Access Restricted
        </h1>
        <p className="text-muted-foreground mb-6">
          Your access to this part of the platform is currently suspended.
        </p>
        <div className="bg-muted p-4 rounded-md mb-8 text-left">
            <p className="font-semibold mb-2">Reason for Restriction:</p>
            <p className="text-sm text-muted-foreground">{reason}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          If you believe this is an error or wish to appeal, please contact our support team.
        </p>
         <Button variant="link" asChild className="mt-2">
            <Link href="/dashboards/support">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
