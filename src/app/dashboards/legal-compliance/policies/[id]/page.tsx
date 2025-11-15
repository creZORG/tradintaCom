
'use client';

import * as React from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, updateDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Check, X, Loader2, Scale } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-log';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type PolicyData = {
    paymentPolicy?: string;
    shippingPolicy?: string;
    returnPolicy?: string;
};

type ManufacturerData = {
  id: string;
  shopName?: string;
  paymentPolicy?: string;
  shippingPolicy?: string;
  returnPolicy?: string;
  pendingPolicies?: PolicyData;
};

const PolicyDiffViewer = ({ title, current, pending }: { title: string; current?: string; pending?: string }) => {
    if (!pending || current === pending) {
        return null;
    }
    
    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-xs text-muted-foreground">Current</Label>
                    <p className="text-xs p-3 bg-muted/50 rounded-md whitespace-pre-wrap min-h-[100px]">{current || 'Not set.'}</p>
                </div>
                <div>
                    <Label className="text-xs text-green-600">Proposed Change</Label>
                    <p className="text-xs p-3 bg-green-50 dark:bg-green-900/20 rounded-md whitespace-pre-wrap min-h-[100px]">{pending}</p>
                </div>
            </div>
        </div>
    );
}

export default function PolicyReviewPage() {
    const params = useParams();
    const router = useRouter();
    const manufacturerId = params.id as string;
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);
    
    const manufRef = useMemoFirebase(() => {
        if (!firestore || !manufacturerId) return null;
        return doc(firestore, 'manufacturers', manufacturerId);
    }, [firestore, manufacturerId]);
    
    const { data: manufacturer, isLoading } = useDoc<ManufacturerData>(manufRef);

    const handleApproval = async (approve: boolean) => {
        if (!manufRef || !manufacturer?.pendingPolicies) return;

        setIsProcessing(true);
        const action = approve ? 'SELLER_POLICY_APPROVED' : 'SELLER_POLICY_REJECTED';
        const status = approve ? 'approved' : 'rejected';

        try {
            const updateData: { [key: string]: any } = {
                policyChangesStatus: status,
                pendingPolicies: FieldValue.delete(), // Always clear pending data
            };
            
            if (approve) {
                // If approving, merge the pending policies into the main fields
                Object.assign(updateData, manufacturer.pendingPolicies);
            }

            await updateDoc(manufRef, updateData);

            await logActivity(firestore, auth, action, `Policy changes for ${manufacturer.shopName} (ID: ${manufacturer.id}) were ${status}.`);

            toast({ title: `Policies ${status}`, description: `The seller's policy changes have been ${status}.` });

            router.push('/dashboards/legal-compliance?tab=policy-management');

        } catch (error: any) {
            toast({ title: 'Operation Failed', description: error.message, variant: 'destructive' });
            setIsProcessing(false);
        }
    };
    
    if(isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!manufacturer) {
        return notFound();
    }
    
    const pending = manufacturer.pendingPolicies;
    const hasPendingChanges = pending && (pending.paymentPolicy || pending.shippingPolicy || pending.returnPolicy);


    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/dashboards/legal-compliance">Legal Dashboard</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Review Policy Changes</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/legal-compliance?tab=policy-management">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Review Policies for {manufacturer.shopName}
                </h1>
                 <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="destructive" onClick={() => handleApproval(false)} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4" />}
                        Reject All
                    </Button>
                     <Button onClick={() => handleApproval(true)} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                        Approve All
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Proposed Policy Updates</CardTitle>
                    <CardDescription>Compare the current live policies with the proposed changes submitted by the seller.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!hasPendingChanges ? (
                        <p className="text-muted-foreground text-center py-8">No pending policy changes found for this seller.</p>
                    ) : (
                        <>
                           <PolicyDiffViewer title="Payment Policy" current={manufacturer.paymentPolicy} pending={pending?.paymentPolicy} />
                           <PolicyDiffViewer title="Shipping Policy" current={manufacturer.shippingPolicy} pending={pending?.shippingPolicy} />
                           <PolicyDiffViewer title="Return Policy" current={manufacturer.returnPolicy} pending={pending?.returnPolicy} />
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
