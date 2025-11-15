
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Eye, Truck, CheckCircle, Clock, Package } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Shipment = {
    id: string;
    orderId: string;
    shippingAddress: string;
    status: 'Pending Pickup' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Failed' | 'Returned';
    createdAt: any; // Firestore timestamp
    trackingNumber?: string;
    logisticsPartner?: string;
};

const getStatusBadge = (status: Shipment['status']) => {
    switch(status) {
        case 'Delivered': return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'In Transit':
        case 'Out for Delivery':
             return <Badge><Truck className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'Pending Pickup': return <Badge variant="outline"><Package className="mr-1 h-3 w-3"/>{status}</Badge>;
        default: return <Badge variant="destructive">{status}</Badge>;
    }
};

export function ShipmentsTab() {
    const firestore = useFirestore();

    const shipmentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'shipments'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: shipments, isLoading } = useCollection<Shipment>(shipmentsQuery);

    const renderTableRows = (shipmentData: Shipment[] | null) => {
        if (isLoading) {
            return Array.from({length: 5}).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-28" /></TableCell>
                </TableRow>
            ));
        }
        if (!shipmentData || shipmentData.length === 0) {
            return <TableRow><TableCell colSpan={6} className="h-24 text-center">No shipments found.</TableCell></TableRow>;
        }
        return shipmentData.map(shipment => (
            <TableRow key={shipment.id}>
                <TableCell className="font-mono text-xs">{shipment.id.substring(0,8)}...</TableCell>
                <TableCell>{shipment.shippingAddress}</TableCell>
                <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                <TableCell>{shipment.logisticsPartner || 'N/A'}</TableCell>
                <TableCell>{shipment.trackingNumber || 'N/A'}</TableCell>
                 <TableCell>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboards/tradinta-direct-admin/orders/${shipment.orderId}`}>
                            <Eye className="mr-2 h-4 w-4"/> View Order
                        </Link>
                    </Button>
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Shipment Management</CardTitle>
                <CardDescription>Monitor and track all outgoing B2C shipments.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Shipment ID</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Partner</TableHead>
                            <TableHead>Tracking #</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableRows(shipments)}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
