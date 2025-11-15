
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Home,
  Package,
  Settings,
  ShoppingBag,
  List,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TradintaDirectSidebar } from '@/components/tradinta-direct/sidebar';

export default function TradintaDirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
