
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, Save, FileText, User, UserX } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { logActivity } from '@/lib/activity-log';

type Dispute = {
    id: string;
    orderId: string;
    buyerName: string;
    sellerName: string;
    reason: string;
    details: string;
    status: 'Open' | 'Under Review' | 'Awaiting Buyer Response' | 'Awaiting Seller Response' | 'Resolved';
    createdAt: any;
    resolution?: string;
    fault?: 'Buyer' | 'Seller' | 'None';
};

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || 'Not provided'}</p>
    </div>
);

export default function DisputeResolutionPage() {
    const params = useParams();
    const router = useRouter();
    const disputeId = params.id as string;
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    const [isSaving, setIsSaving] = React.useState(false);
    const [resolution, setResolution] = React.useState('');
    const [fault, setFault] = React.useState<'Buyer' | 'Seller' | 'None' | ''>('');

    const disputeDocRef = useMemoFirebase(() => {
        if (!firestore || !disputeId) return null;
        return doc(firestore, 'disputes', disputeId);
    }, [firestore, disputeId]);

    const { data: dispute, isLoading } = useDoc<Dispute>(disputeDocRef);

    const handleResolveDispute = async () => {
        if (!disputeDocRef || !fault) {
            toast({ title: "Fault assignment is required.", variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        try {
            await updateDocumentNonBlocking(disputeDocRef, {
                status: 'Resolved',
                resolution,
                fault,
                resolvedAt: serverTimestamp(),
            });

            await logActivity(
                firestore,
                auth,
                'DISPUTE_RESOLVED',
                `Dispute ${disputeId} resolved. Fault assigned to: ${fault}. Resolution: ${resolution}`
            );

            toast({ title: 'Dispute Resolved', description: 'The dispute has been successfully closed.' });
            router.push('/dashboards/operations-manager?tab=disputes');

        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to resolve dispute: ' + error.message, variant: 'destructive' });
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div className="space-y-6"><Skeleton className="h-[70vh]" /></div>
    }

    if (!dispute) {
        return <div>Dispute not found.</div>
    }

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboards/operations-manager">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboards/operations-manager?tab=disputes">Disputes</Link></BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Mediation</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/operations-manager?tab=disputes"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">Dispute Mediation</h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                     {dispute.status !== 'Resolved' && (
                        <Button onClick={handleResolveDispute} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Save & Resolve Dispute
                        </Button>
                     )}
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>Dispute Details</CardTitle>
                                <Badge variant="destructive">{dispute.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <DetailItem label="Dispute ID" value={dispute.id} />
                                <DetailItem label="Order ID" value={<Button variant="link" size="sm" asChild className="p-0 h-auto font-semibold"><Link href={`/dashboards/seller-centre/orders/${dispute.orderId}`} target="_blank">{dispute.orderId}</Link></Button>} />
                                <DetailItem label="Buyer" value={dispute.buyerName} />
                                <DetailItem label="Seller" value={dispute.sellerName} />
                            </div>
                            <DetailItem label="Reason for Dispute" value={dispute.reason} />
                            <div>
                                <p className="text-sm text-muted-foreground">Buyer's Explanation</p>
                                <blockquote className="mt-2 border-l-2 pl-4 italic text-sm">
                                    {dispute.details || "No further details provided."}
                                </blockquote>
                            </div>
                        </CardContent>
                     </Card>
                </div>
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Resolution Center</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="resolution">Resolution Summary</Label>
                                <Textarea id="resolution" placeholder="Explain the final decision and next steps..." value={resolution} onChange={e => setResolution(e.target.value)} disabled={dispute.status === 'Resolved'} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Assign Fault</Label>
                                <RadioGroup value={fault} onValueChange={(v) => setFault(v as any)} disabled={dispute.status === 'Resolved'}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Buyer" id="fault-buyer" /><Label htmlFor="fault-buyer" className="font-normal flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/> Buyer</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Seller" id="fault-seller" /><Label htmlFor="fault-seller" className="font-normal flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/> Seller</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="None" id="fault-none" /><Label htmlFor="fault-none" className="font-normal flex items-center gap-2"><UserX className="w-4 h-4 text-muted-foreground"/> No Fault</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
