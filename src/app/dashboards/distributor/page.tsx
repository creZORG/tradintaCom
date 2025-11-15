
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Repeat, Package, Star, Eye, Truck, CheckCircle, Clock } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Order = {
    id: string;
    sellerName: string;
    totalAmount: number;
    status: string;
    orderDate: any;
    items?: { productName: string }[];
};

const reorderItems = [
    { id: 'PROD-001', name: 'Industrial Grade Cement', lastOrder: '2023-10-20', frequency: 'Monthly', stock: 'Low' },
    { id: 'PROD-002', name: 'Commercial Baking Flour', lastOrder: '2023-09-15', frequency: 'Monthly', stock: 'Medium' },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Delivered':
        case 'Accepted':
            return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'Processing':
        case 'Shipped':
            return <Badge><Truck className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'Pending':
        case 'Pending Payment':
            return <Badge variant="outline"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

const getOrderDescription = (order: Order) => {
    if (order.items && order.items.length > 0) {
        const firstItem = order.items[0].productName;
        return order.items.length > 1 ? `${firstItem} + ${order.items.length - 1} more` : firstItem;
    }
    return 'Order Details';
}

export default function DistributorDashboard() {
    React.useEffect(() => {
        document.title = 'Distributor Dashboard | Tradinta';
    }, []);

    const { user } = useUser();
    const firestore = useFirestore();

    const ordersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
          collection(firestore, 'orders'),
          where('buyerId', '==', user.uid),
          where('isTradintaDirect', '!=', true), // Exclude B2C orders
          orderBy('isTradintaDirect', 'asc'),
          orderBy('orderDate', 'desc')
        );
    }, [user, firestore]);
    
    const { data: bulkOrders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

    return (
        <Tabs defaultValue="bulk-orders">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bulk-orders">Bulk Orders</TabsTrigger>
                <TabsTrigger value="reorder">Quick Re-order</TabsTrigger>
                <TabsTrigger value="shop">My Mini-Shop</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bulk-orders">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>My Bulk Orders</CardTitle>
                                <CardDescription>Manage your large volume and wholesale purchases from manufacturers.</CardDescription>
                            </div>
                            <Button asChild><Link href="/products"><ShoppingCart className="mr-2 h-4 w-4" /> Place New Bulk Order</Link></Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Total (KES)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingOrders ? (
                                    Array.from({length: 3}).map((_, i) => (
                                        <TableRow key={`skel-${i}`}>
                                            <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                            <TableCell><Skeleton className="h-5 w-48"/></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                                            <TableCell><Skeleton className="h-9 w-28"/></TableCell>
                                        </TableRow>
                                    ))
                                ) : bulkOrders && bulkOrders.length > 0 ? (
                                    bulkOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                                        <TableCell>{getOrderDescription(order)}</TableCell>
                                        <TableCell>{order.sellerName}</TableCell>
                                        <TableCell>{order.totalAmount.toLocaleString()}</TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/orders/${order.id}`}>
                                                    <Eye className="mr-2 h-4 w-4"/>View Details
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">You have not placed any bulk orders.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="reorder">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Re-order</CardTitle>
                        <CardDescription>Easily re-order frequently purchased items. (Coming Soon)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Last Order Date</TableHead>
                                    <TableHead>Purchase Frequency</TableHead>
                                    <TableHead>Est. Stock Level</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reorderItems.map((item) => (
                                    <TableRow key={item.id} className="opacity-50">
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.lastOrder}</TableCell>
                                        <TableCell>{item.frequency}</TableCell>
                                        <TableCell><Badge variant={item.stock === 'Low' ? 'destructive' : 'outline'}>{item.stock}</Badge></TableCell>
                                        <TableCell>
                                            <Button size="sm" disabled><Repeat className="mr-2 h-4 w-4" /> Re-order Now</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="shop">
                 <Card>
                    <CardHeader>
                        <CardTitle>My Mini-Shop</CardTitle>
                        <CardDescription>Manage your public-facing shop for reselling products to other businesses.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                            <div>
                                <Star className="mx-auto h-12 w-12 text-yellow-400" />
                                <h3 className="mt-4 text-lg font-medium">Shop Privileges Not Yet Unlocked</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Meet the minimum bulk order threshold to unlock your distributor shop and start reselling on Tradinta.
                                </p>
                                <Button className="mt-4" disabled>Learn More (Coming Soon)</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
    
