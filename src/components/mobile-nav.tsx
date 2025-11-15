
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Handshake, TrendingUp } from 'lucide-react';
import { useUser } from '@/firebase';
import { Separator } from './ui/separator';

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mainLinks = [
  { href: '/products', label: 'Products' },
  { href: '/foundry', label: 'The Foundry' },
  { href: '/tradepay/about', label: 'TradePay' },
  { href: '/blog', label: 'Insights' },
];

const growthLinks = [
  { href: '/marketing-plans', label: 'Marketing Plans', icon: <TrendingUp className="mr-2 h-5 w-5" /> },
  { href: '/partners', label: 'Growth Partners', icon: <Handshake className="mr-2 h-5 w-5" /> },
];

const dashboardLinks = [
  { href: '/dashboards/seller-centre', label: 'Seller Centre' },
  { href: '/dashboards/buyer', label: 'Buyer Dashboard' },
  { href: '/dashboards/distributor', label: 'Distributor Dashboard' },
];

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { user } = useUser();

  const closeSheet = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="h-full w-full bg-background p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          <nav className="flex flex-col space-y-4">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeSheet}
                className="text-xl font-medium text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Accordion type="single" collapsible className="w-full">
             <AccordionItem value="grow">
              <AccordionTrigger className="text-xl font-medium">
                Grow
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col space-y-3 pt-3">
                  {growthLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeSheet}
                      className="text-lg text-muted-foreground hover:text-primary flex items-center"
                    >
                      {link.icon} {link.label}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="dashboards">
              <AccordionTrigger className="text-xl font-medium">
                Dashboards
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col space-y-3 pt-3">
                  {dashboardLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeSheet}
                      className="text-lg text-muted-foreground hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Separator />
          
          {user ? (
             <div className="space-y-4">
                <p className="font-semibold">My Account</p>
                 <Link
                    href="/dashboards/seller-centre"
                    onClick={closeSheet}
                    className="block text-lg text-muted-foreground hover:text-primary"
                  >
                    Dashboard
                  </Link>
                   <Link
                    href="/dashboards/seller-centre/messages"
                    onClick={closeSheet}
                    className="block text-lg text-muted-foreground hover:text-primary"
                  >
                    Messages
                  </Link>
             </div>
          ) : (
             <div className="flex flex-col space-y-4">
                <Button size="lg" asChild onClick={closeSheet}>
                    <Link href="/login">Log In</Link>
                </Button>
                 <Button size="lg" variant="secondary" asChild onClick={closeSheet}>
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
