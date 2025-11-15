
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  tradintaDirectStatus: 'pending_setup' | 'live' | 'paused';
  variants: { retailPrice?: number; price: number; stock: number; b2cStock?: number; }[];
};

export function LiveProductsTab() {
  const { user } = useUser();
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(firestore, 'manufacturers', user.uid, 'products'),
      where('listOnTradintaDirect', '==', true),
      where('tradintaDirectStatus', '==', 'live')
    );
  }, [firestore, user]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  
  const renderTableRows = () => {
    if (isLoadingProducts) {
      return Array.from({ length: 2 }).map((_, i) => (
        <TableRow key={`skl-${i}`}>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-6 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-9 w-28" /></TableCell>
        </TableRow>
      ));
    }

    if (!products || products.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            You have no live products on Tradinta Direct.
          </TableCell>
        </TableRow>
      );
    }

    return products.map((product) => (
      <TableRow key={product.id}>
        <TableCell className="hidden sm:table-cell">
          <Image
            alt={product.name}
            className="aspect-square rounded-md object-cover"
            height="64"
            src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
            width="64"
          />
        </TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell>
            {`KES ${product.variants?.[0]?.retailPrice?.toLocaleString() || 'N/A'}`}
        </TableCell>
        <TableCell>
            {product.variants?.[0]?.b2cStock || 0}
        </TableCell>
        <TableCell>
            <Button asChild variant="outline">
              <Link href={`/dashboards/seller-centre/direct/analytics/${product.id}`}>
                Manage
              </Link>
            </Button>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Card>
       <CardHeader>
           <CardTitle>Live B2C Products</CardTitle>
           <CardDescription>These products are currently active on the Tradinta Direct storefront.</CardDescription>
       </CardHeader>
       <CardContent>
           <Table>
               <TableHeader>
                   <TableRow>
                       <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                       <TableHead>Product</TableHead>
                       <TableHead>Retail Price</TableHead>
                       <TableHead>B2C Stock</TableHead>
                       <TableHead>Action</TableHead>
                   </TableRow>
               </TableHeader>
               <TableBody>
                   {renderTableRows()}
               </TableBody>
           </Table>
       </CardContent>
   </Card>
  );
}
