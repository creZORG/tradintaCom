
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useAuth } from '@/firebase';
import { doc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Check, X, MessageSquare, ExternalLink, Loader2, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { logActivity } from '@/lib/activity-log';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { sendVerificationSuccessEmail, sendVerificationRejectionEmail } from '@/app/lib/actions/auth';
import { scanAndRedactId, deleteOriginalDocument } from '@/services/verification-service';


type Manufacturer = {
  id: string;
  shopName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  businessLicenseNumber?: string;
  kraPin?: string;
  address?: string;
  certifications?: string[];
  ownerIdUrl?: string;
  redactedOwnerId?: string;
  verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
  rejectionReason?: string;
};

const statusMap: Record<NonNullable<Manufacturer['verificationStatus']>, {
    text: string;
    variant: 'secondary' | 'default' | 'destructive' | 'outline';
}> = {
    'Unsubmitted': { text: 'Unsubmitted', variant: 'outline' },
    'Pending Legal': { text: 'Pending Legal Review', variant: 'default' },
    'Pending Admin': { text: 'Pending Admin Approval', variant: 'default' },
    'Action Required': { text: 'Action Required', variant: 'destructive' },
    'Verified': { text: 'Verified', variant: 'secondary' }
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || 'Not provided'}</p>
    </div>
);

export default function VerificationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const manufacturerId = params.id as string;
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');

    const manufRef = useMemoFirebase(() => {
        if (!firestore || !manufacturerId) return null;
        return doc(firestore, 'manufacturers', manufacturerId);
    }, [firestore, manufacturerId]);

    const { data: manufacturer, isLoading } = useDoc<Manufacturer>(manufRef);
    
    React.useEffect(() => {
        if(manufacturer?.rejectionReason) {
            setRejectionReason(manufacturer.rejectionReason);
        }
    }, [manufacturer]);

    const handleUpdateStatus = async (
        newStatus: NonNullable<Manufacturer['verificationStatus']>,
        reason?: string
    ) => {
        if (!manufRef || !auth?.currentUser || !manufacturer) return;

        if (newStatus === 'Action Required' && !reason?.trim()) {
            toast({
                title: "Rejection Reason Required",
                description: "Please provide a reason for sending it back to the user.",
                variant: "destructive",
            });
            return;
        }

        setIsUpdating(true);
        const dataToUpdate: { [key: string]: any } = { verificationStatus: newStatus };
        let action = '';
        let details = '';

        try {
            switch(newStatus) {
                case 'Pending Admin':
                    action = 'VERIFICATION_LEGAL_APPROVED';
                    details = `Legal documents approved for ${manufacturer.shopName} (ID: ${manufacturer.id}). Moved to Admin queue.`;
                    break;
                case 'Verified':
                    dataToUpdate.rejectionReason = FieldValue.delete();
                    
                    if (manufacturer.ownerIdUrl) {
                      // 1. Scan, redact, and store the ID number
                      const redactedId = await scanAndRedactId(manufacturer.ownerIdUrl);
                      dataToUpdate.redactedOwnerId = redactedId;
                      // 2. Delete the original document from Cloudinary
                      await deleteOriginalDocument(manufacturer.ownerIdUrl);
                      // 3. Remove the URL from Firestore
                      dataToUpdate.ownerIdUrl = FieldValue.delete();
                    }

                    action = 'VERIFICATION_ADMIN_APPROVED';
                    details = `Final approval for manufacturer: ${manufacturer.shopName} (ID: ${manufacturer.id}). Shop is now verified.`;
                    
                     if(manufacturer.email && manufacturer.ownerName) {
                        await sendVerificationSuccessEmail(manufacturer.email, manufacturer.ownerName);
                    }
                    break;
                case 'Action Required':
                     if (reason) {
                        dataToUpdate.rejectionReason = reason;
                        action = 'VERIFICATION_REJECTED';
                        details = `Rejected manufacturer ${manufacturer.shopName} (ID: ${manufacturer.id}). Reason: ${reason}`;
                        if(manufacturer.email && manufacturer.ownerName) {
                            await sendVerificationRejectionEmail({
                                to: manufacturer.email,
                                name: manufacturer.ownerName,
                                reason: reason,
                            });
                        }
                    }
                    break;
            }
            
            await updateDocumentNonBlocking(manufRef, dataToUpdate);
            if (action) {
                 await logActivity(firestore, auth, action, details);
            }

            toast({
                title: "Status Updated",
                description: `Manufacturer has been set to "${statusMap[newStatus].text}".`
            });

            setTimeout(() => {
                router.push('/dashboards/admin?tab=onboarding');
            }, 1000);
        
        } catch(error: any) {
            console.error("Error updating verification status:", error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const getApprovalAction = () => {
        if (manufacturer?.verificationStatus === 'Pending Legal') {
            return {
                label: 'Approve Legal Docs',
                handler: () => handleUpdateStatus('Pending Admin'),
            }
        }
         if (manufacturer?.verificationStatus === 'Pending Admin') {
            return {
                label: 'Final Approve & Verify',
                handler: () => handleUpdateStatus('Verified'),
            }
        }
        return null;
    }
    
    const approvalAction = getApprovalAction();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    </div>
                    <div className="md:col-span-1 space-y-6">
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!manufacturer) {
        return (
            <div>
                <h1 className="text-xl font-semibold">Manufacturer not found.</h1>
                <p className="text-muted-foreground">The requested manufacturer profile could not be loaded.</p>
            </div>
        )
    }

    const currentStatus = statusMap[manufacturer.verificationStatus || 'Unsubmitted'];

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboards/admin">Admin Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Verification</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">{manufacturer.shopName || 'Unnamed Shop'}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Application Review</span>
                            <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" disabled={isUpdating} onClick={() => handleUpdateStatus('Action Required', rejectionReason)}>
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4" />}
                        Reject
                    </Button>
                    {approvalAction && (
                         <Button disabled={isUpdating} onClick={approvalAction.handler}>
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                            {approvalAction.label}
                        </Button>
                    )}
                </div>
            </div>

            <Separator />

             <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <DetailItem label="Legal Company Name" value={manufacturer.shopName} />
                            <DetailItem label="Owner Name" value={manufacturer.ownerName} />
                            <DetailItem label="Business Phone" value={manufacturer.phone} />
                            <DetailItem label="Business Email" value={manufacturer.email} />
                            <DetailItem label="KRA PIN" value={manufacturer.kraPin} />
                            <DetailItem label="Business Registration No." value={manufacturer.businessLicenseNumber} />
                            <div className="sm:col-span-2">
                                <DetailItem label="Physical Address" value={manufacturer.address} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Review & Communication</CardTitle></CardHeader>
                        <CardContent>
                             <Label htmlFor="rejection-reason">Rejection Reason (if applicable)</Label>
                             <Textarea 
                                id="rejection-reason"
                                placeholder="If rejecting, provide a clear reason for the applicant..."
                                className="mt-1"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                             />
                             <p className="text-xs text-muted-foreground mt-2">This reason will be stored and can be shown to the applicant.</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary">
                                <MessageSquare className="mr-2 h-4 w-4" /> Send Message to Applicant
                            </Button>
                        </CardFooter>
                     </Card>
                </div>
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Submitted Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button asChild variant="outline" className="w-full justify-between" disabled={!manufacturer.certifications?.[0]}>
                                <a href={manufacturer.certifications?.[0] || '#'} target="_blank" rel="noopener noreferrer">
                                    Cert. of Incorporation <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                             <Button asChild variant="outline" className="w-full justify-between" disabled={!manufacturer.certifications?.[1]}>
                                <a href={manufacturer.certifications?.[1] || '#'} target="_blank" rel="noopener noreferrer">
                                    KRA PIN Certificate <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                             <Button asChild variant="outline" className="w-full justify-between" disabled={!manufacturer.ownerIdUrl}>
                                <a href={manufacturer.ownerIdUrl || '#'} target="_blank" rel="noopener noreferrer">
                                    Owner ID Document <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                    {manufacturer.redactedOwnerId &&
                        <Card>
                            <CardHeader><CardTitle>Redacted ID</CardTitle></CardHeader>
                            <CardContent>
                                <p className="font-mono bg-muted p-2 rounded-md text-sm">{manufacturer.redactedOwnerId}</p>
                            </CardContent>
                        </Card>
                    }
                </div>
             </div>

        </div>
    );
}
