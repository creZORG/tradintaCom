
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Package, Truck, Clock, Eye, CheckCircle } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { subDays, format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Order = {
    id: string;
    totalAmount: number;
    status: string;
    orderDate: Timestamp;
    deliveredAt?: Timestamp;
    buyerName?: string;
    items?: { productName: string }[];
};

const StatCard = ({ title, value, isLoading, icon, description }: { title: string, value: string, isLoading: boolean, icon: React.ReactNode, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Delivered': return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'Processing': return <Badge><Package className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'Shipped': return <Badge><Truck className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'Pending Payment': return <Badge variant="outline"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

const getOrderDescription = (order: Order) => {
    if (order.items && order.items.length > 0) {
        const firstItem = order.items[0].productName;
        return order.items.length > 1 ? `${firstItem} + ${order.items.length - 1} more` : firstItem;
    }
    return 'Order Details';
}

export function OverviewTab() {
    const firestore = useFirestore();

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'orders'),
            where('isTradintaDirect', '==', true)
        );
    }, [firestore]);
    
    const shipmentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'shipments'), where('status', '==', 'In Transit'));
    }, [firestore]);

    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);
    const { data: shipments, isLoading: isLoadingShipments } = useCollection(shipmentsQuery);
    
    const isLoading = isLoadingOrders || isLoadingShipments;

    const stats = React.useMemo(() => {
        if (!orders) return null;
        
        const thirtyDaysAgo = subDays(new Date(), 30);
        const ordersLast30Days = orders.filter(o => o.orderDate.toDate() > thirtyDaysAgo);
        
        const totalRevenue = ordersLast30Days.reduce((sum, order) => sum + order.totalAmount, 0);
        const ordersToFulfill = orders.filter(o => o.status === 'Processing').length;
        
        // Calculate Average Fulfillment Time
        const deliveredOrders = orders.filter(o => o.status === 'Delivered' && o.deliveredAt && o.orderDate);
        let avgFulfillmentTime = 0;
        if (deliveredOrders.length > 0) {
            const totalFulfillmentDays = deliveredOrders.reduce((sum, order) => {
                const fulfillmentDays = differenceInDays(order.deliveredAt!.toDate(), order.orderDate.toDate());
                return sum + fulfillmentDays;
            }, 0);
            avgFulfillmentTime = totalFulfillmentDays / deliveredOrders.length;
        }
        
        const weeklyData = orders.filter(o => o.orderDate.toDate() > subDays(new Date(), 7)).reduce((acc, order) => {
            const day = format(order.orderDate.toDate(), 'eee');
            acc[day] = (acc[day] || 0) + order.totalAmount;
            return acc;
        }, {} as Record<string, number>);
        
        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = dayOrder.map(day => ({ day, Revenue: weeklyData[day] || 0 }));
        
        return { 
            totalRevenue, 
            ordersToFulfill, 
            chartData, 
            avgFulfillmentTime,
            recentOrders: orders.sort((a,b) => b.orderDate.seconds - a.orderDate.seconds).slice(0,5) 
        };

    }, [orders]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>B2C Fulfillment Overview</CardTitle>
                    <CardDescription>A snapshot of your direct-to-consumer sales and fulfillment operations.</CardDescription>
                </CardHeader>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <StatCard title="B2C Revenue (30d)" value={`KES ${stats?.totalRevenue.toLocaleString() || '0'}`} icon={<DollarSign />} isLoading={isLoading} />
                 <StatCard title="Orders to Fulfill" value={`${stats?.ordersToFulfill || '0'}`} icon={<Package />} isLoading={isLoading} />
                 <StatCard title="Shipments in Transit" value={`${shipments?.length || '0'}`} icon={<Truck />} isLoading={isLoading} />
                 <StatCard title="Avg. Fulfillment Time" value={stats ? `${stats.avgFulfillmentTime.toFixed(1)} Days` : 'N/A'} icon={<Clock />} isLoading={isLoading} />
            </div>
             <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Buyer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                                </TableRow>
                            )) : stats?.recentOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                    <TableCell>{order.buyerName}</TableCell>
                                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                                    <TableCell className="text-right font-medium">KES {order.totalAmount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboards/tradinta-direct-admin/orders/${order.id}`}>
                                                <Eye className="mr-2 h-4 w-4" /> View
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
    )
}
