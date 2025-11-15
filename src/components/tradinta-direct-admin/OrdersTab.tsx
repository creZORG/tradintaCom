
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Eye, Truck, CheckCircle, Clock } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Order = {
    id: string;
    buyerName: string;
    totalAmount: number;
    status: string;
    orderDate: any; // Firestore timestamp
};

export function OrdersTab() {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchedOrder, setSearchedOrder] = React.useState<Order | null>(null);
    const [isSearching, setIsSearching] = React.useState(false);

    const recentOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'orders'),
            where('isTradintaDirect', '==', true),
            orderBy('orderDate', 'desc'),
            limit(5)
        );
    }, [firestore]);

    const { data: recentOrders, isLoading: isLoadingRecent } = useCollection<Order>(recentOrdersQuery);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !searchQuery.trim()) {
            setSearchedOrder(null);
            return;
        }
        setIsSearching(true);
        setSearchedOrder(null);
        try {
            const orderRef = doc(firestore, 'orders', searchQuery.trim());
            const docSnap = await getDoc(orderRef);

            if (!docSnap.exists() || !docSnap.data().isTradintaDirect) {
                setSearchedOrder(null);
            } else {
                setSearchedOrder({ id: docSnap.id, ...docSnap.data() } as Order);
            }
        } catch (error) {
            console.error('Error searching order: ', error);
        } finally {
            setIsSearching(false);
        }
    };
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Delivered': return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>{status}</Badge>;
            case 'Processing': return <Badge><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
            case 'Shipped': return <Badge><Truck className="mr-1 h-3 w-3"/>{status}</Badge>;
            case 'Pending Payment': return <Badge variant="outline"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const renderTableRows = (orders: Order[] | null, isLoading: boolean) => {
        if (isLoading) {
            return Array.from({length: 5}).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-28" /></TableCell>
                </TableRow>
            ));
        }
        if (!orders || orders.length === 0) {
            return <TableRow><TableCell colSpan={5} className="h-24 text-center">No orders found.</TableCell></TableRow>;
        }
        return orders.map(order => (
            <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id}</TableCell>
                <TableCell>{order.buyerName}</TableCell>
                <TableCell>KES {order.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboards/tradinta-direct-admin/orders/${order.id}`}><Eye className="mr-2 h-4 w-4"/> View Order</Link>
                    </Button>
                </TableCell>
            </TableRow>
        ));
    };
    
    return (
         <Card>
            <CardHeader>
                <CardTitle>Order Fulfillment Queue</CardTitle>
                <CardDescription>
                    {searchedOrder ? 'Showing search result. Clear search to see all recent orders.' : 'Showing the 5 most recent B2C orders.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4 max-w-md">
                    <Input placeholder="Search by Order ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <Button type="submit" disabled={isSearching}>
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </form>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Buyer Name</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableRows(searchedOrder ? [searchedOrder] : recentOrders, isLoadingRecent)}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
