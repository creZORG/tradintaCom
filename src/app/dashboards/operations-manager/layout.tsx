'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { PermissionDenied } from '@/components/ui/permission-denied';
import { hasPermission } from '@/lib/roles';
import { OperationsSidebar } from '@/components/operations/sidebar';

export default function OperationsManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading, role } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }
  
  const canAccess = role && hasPermission(role, 'system:view:platform_health');

  if (!canAccess) {
    return <PermissionDenied />;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <OperationsSidebar />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
