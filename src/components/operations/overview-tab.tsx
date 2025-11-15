'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Package, AlertCircle, BarChart, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

type Order = {
    id: string;
    productName?: string;
    items?: {productName: string}[];
    status: string;
    totalAmount: number;
    buyerId: string;
};

type Dispute = {
    id: string;
};

export function OverviewTab() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const recentOrdersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'), limit(10)) : null, [firestore]);
  const openDisputesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'disputes'), where('status', 'in', ['Open', 'Under Review'])) : null, [firestore]);

  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);
  const { data: recentOrders, isLoading: isLoadingOrders } = useCollection<Order>(recentOrdersQuery);
  const { data: openDisputes, isLoading: isLoadingDisputes } = useCollection<Dispute>(openDisputesQuery);

  const getOrderDescription = (order: Order) => {
    if (order.productName) return order.productName;
    if (order.items && order.items.length > 0) {
        const firstItem = order.items[0].productName;
        return order.items.length > 1 ? `${firstItem} + ${order.items.length - 1} more` : firstItem;
    }
    return 'Order Details';
  };

  const renderSkeletonRows = (count: number, columns: number) => Array.from({length: count}).map((_, i) => (
    <TableRow key={`skel-${i}`}>
        {Array.from({length: columns}).map((_, j) => (
             <TableCell key={`skel-cell-${j}`}><Skeleton className="h-5 w-full" /></TableCell>
        ))}
    </TableRow>
  ));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{users?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Across all roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{recentOrders?.filter(o => o.status === 'Processing').length || 0}</div>}
            <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingDisputes ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold text-destructive">{openDisputes?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Requiring mediation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue (Today)</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 45,231</div>
            <p className="text-xs text-muted-foreground">from transaction fees</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
           <Table>
             <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Description</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
             <TableBody>
                {isLoadingOrders ? renderSkeletonRows(3, 5) : 
                 !recentOrders || recentOrders.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">No recent orders.</TableCell></TableRow>
                 : recentOrders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                        <TableCell>{getOrderDescription(order)}</TableCell>
                        <TableCell>KES {order.totalAmount.toLocaleString()}</TableCell>
                        <TableCell><Badge>{order.status}</Badge></TableCell>
                        <TableCell><Button variant="outline" size="sm">View</Button></TableCell>
                    </TableRow>
                 ))}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
