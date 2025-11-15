
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type Dispute = {
    id: string;
    orderId: string;
    buyerId: string;
    sellerId: string;
    buyerName: string;
    sellerName: string;
    reason: string;
    status: string;
};

export function DisputesTab() {
  const firestore = useFirestore();

  const openDisputesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'disputes'), where('status', 'in', ['Open', 'Under Review']));
  }, [firestore]);

  const { data: openDisputes, isLoading: isLoadingDisputes } = useCollection<Dispute>(openDisputesQuery);

  const renderSkeletonRows = (count: number, columns: number) => Array.from({ length: count }).map((_, i) => (
    <TableRow key={`skel-${i}`}>
        {Array.from({ length: columns }).map((_, j) => (
             <TableCell key={`skel-cell-${j}`}><Skeleton className="h-5 w-full" /></TableCell>
        ))}
    </TableRow>
  ));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Disputes</CardTitle>
        <CardDescription>Mediate and resolve conflicts between buyers and sellers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispute ID</TableHead>
              <TableHead>Involved Parties</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingDisputes ? renderSkeletonRows(1, 5) : 
             !openDisputes || openDisputes.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">No open disputes.</TableCell></TableRow>
             : openDisputes.map((dispute) => (
                <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-xs">{dispute.id.substring(0, 10)}...</TableCell>
                    <TableCell>{dispute.buyerName} vs. {dispute.sellerName}</TableCell>
                    <TableCell>{dispute.reason}</TableCell>
                    <TableCell><Badge variant="outline">{dispute.status}</Badge></TableCell>
                    <TableCell>
                        <Button asChild size="sm">
                            <Link href={`/dashboards/operations-manager/disputes/${dispute.id}`}>
                                <AlertTriangle className="mr-2 h-4 w-4"/>Mediate
                            </Link>
                        </Button>
                    </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
