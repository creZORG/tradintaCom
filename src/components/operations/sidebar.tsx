
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Home,
  Package,
  ShoppingCart,
  Users,
  LineChart,
  FileWarning,
  Handshake,
  Heart,
  ShieldCheck,
  Activity,
  Server,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Logo } from '../logo';
import { Separator } from '../ui/separator';

const NAV_ITEMS = [
  { href: 'overview', icon: Home, label: 'Overview' },
  { href: 'approvals', icon: ShieldCheck, label: 'Approvals' },
  { href: 'disputes', icon: Handshake, label: 'Disputes' },
  { href: 'activity', icon: Activity, label: 'Activity Log' },
  { href: 'platform-health', icon: Server, label: 'Platform Health' },
];

export function OperationsSidebar() {
  const pathname = usePathname();
  const searchParams = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-auto" />
            <span className="">Operations</span>
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
