
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Scale, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import React from 'react';

type Manufacturer = {
    id: string;
    shopName: string;
    verificationStatus: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
    registrationDate: any;
    certifications?: string[];
    policyChangesStatus?: 'pending' | 'approved' | 'rejected';
    updatedAt?: any;
};


export default function LegalComplianceDashboard() {
    React.useEffect(() => {
        document.title = 'Legal Dashboard | Tradinta';
    }, []);

    const firestore = useFirestore();

    const pendingLegalVerificationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'manufacturers'), where('verificationStatus', '==', 'Pending Legal'), orderBy('registrationDate', 'desc'));
    }, [firestore]);
    
    const pendingPolicyReviewsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'manufacturers'), where('policyChangesStatus', '==', 'pending'));
    }, [firestore]);

    const { data: pendingLegalVerifications, isLoading: isLoadingVerifications } = useCollection<Manufacturer>(pendingLegalVerificationsQuery);
    const { data: pendingPolicyReviews, isLoading: isLoadingPolicies } = useCollection<Manufacturer>(pendingPolicyReviewsQuery);
    
    const renderVerificationRows = () => {
        if (isLoadingVerifications) {
            return Array.from({length: 2}).map((_, i) => (
                <TableRow key={`skel-ver-${i}`}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-40" /></TableCell>
                </TableRow>
            ))
        }
        if (!pendingLegalVerifications || pendingLegalVerifications.length === 0) {
            return <TableRow><TableCell colSpan={4} className="text-center h-24">No applications are currently pending legal review.</TableCell></TableRow>
        }
        return pendingLegalVerifications.map((seller) => (
            <TableRow key={seller.id}>
                <TableCell className="font-medium">{seller.shopName}</TableCell>
                <TableCell>{seller.registrationDate ? new Date(seller.registrationDate?.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell><Badge variant="default">{seller.verificationStatus}</Badge></TableCell>
                <TableCell>
                    <Button size="sm" asChild>
                        <Link href={`/dashboards/admin/verifications/${seller.id}`}>
                            <ShieldCheck className="mr-2 h-4 w-4"/> Review Application
                        </Link>
                    </Button>
                </TableCell>
            </TableRow>
        ));
    };

    const renderPolicyReviewRows = () => {
        if(isLoadingPolicies) {
             return Array.from({length: 1}).map((_, i) => (
                <TableRow key={`skel-pol-${i}`}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                </TableRow>
            ))
        }
        if (!pendingPolicyReviews || pendingPolicyReviews.length === 0) {
            return <TableRow><TableCell colSpan={3} className="text-center h-24">No pending policy changes to review.</TableCell></TableRow>
        }
        return pendingPolicyReviews.map((seller) => (
            <TableRow key={seller.id}>
                <TableCell className="font-medium">{seller.shopName}</TableCell>
                <TableCell>{seller.updatedAt ? new Date(seller.updatedAt.seconds * 1000).toLocaleString() : 'N/A'}</TableCell>
                <TableCell>
                    <Button size="sm" asChild>
                        <Link href={`/dashboards/legal-compliance/policies/${seller.id}`}>
                            <Scale className="mr-2 h-4 w-4"/> Review Changes
                        </Link>
                    </Button>
                </TableCell>
            </TableRow>
        ))
    }

    return (
        <Tabs defaultValue="business-verification">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="business-verification">Business Legitimacy</TabsTrigger>
                <TabsTrigger value="policy-management">Policy Management</TabsTrigger>
            </TabsList>
            
             <TabsContent value="business-verification">
                <Card>
                    <CardHeader>
                        <CardTitle>Business Legitimacy Verification Queue</CardTitle>
                        <CardDescription>Review and verify the legal standing of newly registered businesses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Name</TableHead>
                                    <TableHead>Application Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {renderVerificationRows()}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="policy-management">
                 <Card>
                    <CardHeader>
                        <CardTitle>Seller Policy Changes</CardTitle>
                        <CardDescription>Review and approve updates to shop policies made by verified sellers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shop Name</TableHead>
                                    <TableHead>Date Submitted</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderPolicyReviewRows()}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
