
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ListFilter, MoreHorizontal } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  variants: { retailPrice?: number; b2cStock?: number; }[];
  manufacturerId: string;
  manufacturerName?: string;
  slug: string;
};

export function ProductsTab() {
    const firestore = useFirestore();
    const [productSearch, setProductSearch] = React.useState('');
    const [stockFilter, setStockFilter] = React.useState<'all'|'inStock'|'outOfStock'>('all');

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'products'),
            where('tradintaDirectStatus', '==', 'live')
        );
    }, [firestore]);

    const { data: allProducts, isLoading } = useCollection<Product>(productsQuery);

    const filteredProducts = React.useMemo(() => {
        if (!allProducts) return [];
        return allProducts.filter(p => {
            const matchesSearch = productSearch ? p.name.toLowerCase().includes(productSearch.toLowerCase()) : true;
            
            const totalB2cStock = p.variants?.reduce((sum, v) => sum + (v.b2cStock || 0), 0);
            let matchesStock = true;
            if (stockFilter === 'inStock') matchesStock = totalB2cStock > 0;
            if (stockFilter === 'outOfStock') matchesStock = totalB2cStock === 0;

            return matchesSearch && matchesStock;
        });
    }, [allProducts, productSearch, stockFilter]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>B2C Product Catalog</CardTitle>
                <CardDescription>View and manage all products currently live on Tradinta Direct.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by product name..." 
                            className="pl-8"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                        />
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-1">
                            <ListFilter className="h-3.5 w-3.5" />
                            <span>Filter Stock</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by stock</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <DropdownMenuCheckboxItem checked={stockFilter === 'all'} onCheckedChange={() => setStockFilter('all')}>All</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={stockFilter === 'inStock'} onCheckedChange={() => setStockFilter('inStock')}>In Stock</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={stockFilter === 'outOfStock'} onCheckedChange={() => setStockFilter('outOfStock')}>Out of Stock</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Seller</TableHead>
                            <TableHead>Retail Price</TableHead>
                            <TableHead>B2C Stock</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 4}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-12 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                            </TableRow>
                        )) : filteredProducts.map(p => {
                            const variant = p.variants?.[0];
                            return (
                                <TableRow key={p.id}>
                                    <TableCell className="hidden sm:table-cell">
                                         <Image
                                            alt={p.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={p.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                                            width="64"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{p.manufacturerName || p.manufacturerId}</TableCell>
                                    <TableCell>KES {variant?.retailPrice?.toLocaleString() || 'N/A'}</TableCell>
                                    <TableCell>{variant?.b2cStock || 0}</TableCell>
                                    <TableCell>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/products/${p.manufacturerId}/${p.slug}`} target="_blank">View on Storefront</Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
