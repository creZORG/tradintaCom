
'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { PermissionDenied } from '@/components/ui/permission-denied';

const REQUIRED_ROLES = ['admin', 'super-admin', 'content-management'];

export default function ContentManagementLayout({
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
  
  const hasAccess = role && REQUIRED_ROLES.includes(role);

  if (!hasAccess) {
    return <PermissionDenied />;
  }

  return <>{children}</>;
}
