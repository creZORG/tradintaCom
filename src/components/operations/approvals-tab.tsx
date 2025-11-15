'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type VerificationEntity = {
    id: string;
    shopName?: string;
    companyName?: string;
    verificationStatus?: string;
    registrationDate: any;
};

export function ApprovalsTab() {
  const firestore = useFirestore();

  const pendingVerificationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'manufacturers'), where('verificationStatus', '==', 'Pending Admin'));
  }, [firestore]);

  const { data: pendingVerifications, isLoading: isLoadingVerifications } = useCollection<VerificationEntity>(pendingVerificationsQuery);

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
        <CardTitle>Approvals & Verification</CardTitle>
        <CardDescription>Approve or reject new sellers and buyers waiting for platform access.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingVerifications ? renderSkeletonRows(2, 4) :
             !pendingVerifications || pendingVerifications.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">No pending verifications.</TableCell></TableRow>
             : pendingVerifications.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.shopName || item.companyName}</TableCell>
                    <TableCell>Manufacturer</TableCell>
                    <TableCell>{new Date(item.registrationDate?.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Button asChild variant="outline" size="sm"><Link href={`/dashboards/admin/verifications/${item.id}`}>Review Documents</Link></Button>
                    </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
