
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  List,
  Megaphone,
  Package,
  ShoppingBag,
  ChevronLeft,
} from 'lucide-react';
import { Logo } from '../logo';
import { Button } from '../ui/button';

const NAV_ITEMS = [
  { href: 'overview', icon: Home, label: 'Overview' },
  { href: 'pending', icon: List, label: 'Pending Setup' },
  { href: 'live', icon: Package, label: 'Live Products' },
  { href: 'marketing', icon: Megaphone, label: 'Marketing' },
];

export function TradintaDirectSidebar() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link
            href="/dashboards/seller-centre"
            className="flex items-center gap-2 font-semibold"
          >
            <ShoppingBag className="w-6 h-6 text-primary" />
            <span className="">Tradinta Direct</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
             <Link
                href="/dashboards/seller-centre"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary mb-4'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Seller Centre
              </Link>
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
