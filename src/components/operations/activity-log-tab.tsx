'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

type ActivityLog = {
    id: string;
    timestamp: any;
    userEmail: string;
    action: string;
    details: string;
};

export function ActivityLogTab() {
  const firestore = useFirestore();

  const activityLogsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
  }, [firestore]);

  const { data: activityLogs, isLoading: isLoadingLogs } = useCollection<ActivityLog>(activityLogsQuery);

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
        <CardTitle>Admin Activity Log</CardTitle>
        <CardDescription>A log of all significant administrative actions for auditing purposes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Admin User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="w-[40%]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingLogs ? renderSkeletonRows(5, 4) :
             !activityLogs || activityLogs.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">No activity recorded yet.</TableCell></TableRow>
             : activityLogs.map((log) => (
                <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</TableCell>
                    <TableCell>{log.userEmail}</TableCell>
                    <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                    <TableCell>{log.details}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
