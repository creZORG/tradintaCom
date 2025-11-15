
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, X, AlertTriangle, MessageSquare } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';

type Dispute = {
    id: string;
    orderId: string;
    buyerName: string;
    reason: string;
    status: 'Open' | 'Under Review' | 'Resolved';
    createdAt: any;
};

const getStatusBadge = (status: Dispute['status']) => {
    switch (status) {
        case 'Open':
            return <Badge variant="destructive">{status}</Badge>;
        case 'Under Review':
            return <Badge>{status}</Badge>;
        case 'Resolved':
            return <Badge variant="secondary">{status}</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export function ReturnsTab() {
    const firestore = useFirestore();

    const disputesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // This query fetches disputes related to Tradinta Direct orders.
        // It relies on the convention that `sellerId` is 'tradinta-direct' for such orders.
        return query(
            collection(firestore, 'disputes'), 
            where('sellerId', '==', 'tradinta-direct'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: disputes, isLoading } = useCollection<Dispute>(disputesQuery);

    return (
       <Card>
           <CardHeader>
               <CardTitle>Returns Management (RMAs)</CardTitle>
               <CardDescription>Review, approve, and process customer return requests for Tradinta Direct orders.</CardDescription>
           </CardHeader>
           <CardContent>
               <Table>
                   <TableHeader>
                       <TableRow>
                           <TableHead>Order ID</TableHead>
                           <TableHead>Customer</TableHead>
                           <TableHead>Reason</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead>Actions</TableHead>
                       </TableRow>
                   </TableHeader>
                   <TableBody>
                       {isLoading ? (
                           Array.from({ length: 3 }).map((_, i) => (
                               <TableRow key={i}>
                                   <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                   <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                                   <TableCell><Skeleton className="h-5 w-40"/></TableCell>
                                   <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                                   <TableCell><Skeleton className="h-9 w-28"/></TableCell>
                               </TableRow>
                           ))
                       ) : disputes && disputes.length > 0 ? (
                           disputes.map(dispute => (
                               <TableRow key={dispute.id}>
                                   <TableCell className="font-mono text-xs">{dispute.orderId}</TableCell>
                                   <TableCell>{dispute.buyerName}</TableCell>
                                   <TableCell>{dispute.reason}</TableCell>
                                   <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                                   <TableCell>
                                       <Button variant="outline" size="sm" asChild>
                                           <Link href={`/dashboards/operations-manager/disputes/${dispute.id}`}>
                                                <AlertTriangle className="mr-2 h-4 w-4" /> Mediate
                                           </Link>
                                       </Button>
                                   </TableCell>
                               </TableRow>
                           ))
                       ) : (
                           <TableRow>
                               <TableCell colSpan={5} className="text-center h-24">No pending return requests.</TableCell>
                           </TableRow>
                       )}
                   </TableBody>
               </Table>
           </CardContent>
       </Card>
   )
}
