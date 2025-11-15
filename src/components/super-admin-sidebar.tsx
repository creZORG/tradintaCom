
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { PanelLeft, Shield } from 'lucide-react';
import { useUser } from '@/firebase';
import { ROLES } from '@/lib/roles';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

const customerRoleKeys = ['manufacturer', 'buyer', 'partner', 'distributor'];
const tradPayRoleKeys = ['tradpay-admin', 'tradcoin-admin'];

export function SuperAdminSidebar() {
  const { role } = useUser();
  const [open, setOpen] = React.useState(false);

  if (role !== 'super-admin') {
    return null;
  }

  const adminRoles = Object.entries(ROLES).filter(
    ([key]) => !customerRoleKeys.includes(key) && !tradPayRoleKeys.includes(key) && key !== 'super-admin'
  );
  
  const customerRoles = Object.entries(ROLES).filter(([key]) => customerRoleKeys.includes(key));
  const tradPayRoles = [
    { key: 'tradpay-admin', name: 'TradPay Admin' },
    { key: 'tradcoin-admin', name: 'TradCoin Admin' },
  ];


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-5 left-5 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          variant="secondary"
        >
          <PanelLeft className="h-6 w-6" />
          <span className="sr-only">Open Super Admin Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-xs p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Super Admin View
          </SheetTitle>
          <SheetDescription>Access all dashboards</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-4">
             <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Admin Dashboards</h4>
                <div className="space-y-1">
                    {adminRoles.map(([key, roleData]) => (
                        <Button key={key} variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                            <Link href={`/dashboards/${key}`}>{roleData.name}</Link>
                        </Button>
                    ))}
                </div>
            </div>
            <Separator />
            <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Customer Dashboards</h4>
                <div className="space-y-1">
                    {customerRoles.map(([key, roleData]) => {
                         let href = `/dashboards/${key}`;
                         if (key === 'manufacturer') href = '/dashboards/seller-centre';
                         if (key === 'partner') href = '/dashboards/growth-partner';
                         return (
                            <Button key={key} variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                                <Link href={href}>{roleData.name}</Link>
                            </Button>
                         )
                    })}
                </div>
            </div>
             <Separator />
             <div>
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">TradPay & TradCoin</h4>
                <div className="space-y-1">
                    {tradPayRoles.map((roleData) => (
                        <Button key={roleData.key} variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                            <Link href={`/dashboards/${roleData.key}`}>{roleData.name}</Link>
                        </Button>
                    ))}
                </div>
            </div>
             <Separator />
            <div>
                 <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                    <Link href={`/dashboards/super-admin`}>Super Admin Dashboard</Link>
                </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
