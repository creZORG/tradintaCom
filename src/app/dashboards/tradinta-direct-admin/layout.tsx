
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2, Package, ShoppingCart, Home, Truck, Repeat, ArrowLeftRight } from 'lucide-react';
import { PermissionDenied } from '@/components/ui/permission-denied';
import { hasPermission } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

const NAV_ITEMS = [
  { href: 'overview', icon: Home, label: 'Overview' },
  { href: 'orders', icon: ShoppingCart, label: 'Orders' },
  { href: 'products', icon: Package, label: 'Products & Inventory' },
  { href: 'shipments', icon: Truck, label: 'Shipments' },
  { href: 'returns', icon: ArrowLeftRight, label: 'Returns' },
];

function TradintaDirectSidebar() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboards/tradinta-direct-admin" className="flex items-center gap-2 font-semibold">
             <ShoppingCart className="w-6 h-6 text-primary" />
            <span className="">Direct Admin</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`?tab=${item.href}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  {
                    'bg-muted text-primary': activeTab === item.href,
                  }
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default function TradintaDirectAdminLayout({
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
  
  const canAccess = role && hasPermission(role, 'td_orders:view');

  if (!canAccess) {
    return <PermissionDenied />;
  }

  return (
     <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <TradintaDirectSidebar />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
