
'use client';

import * as React from 'react';
import {
  useFirestore,
  updateDocumentNonBlocking,
} from '@/firebase';
import { serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Clock, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useFormContext } from 'react-hook-form';
import { VerificationFormData } from '@/app/dashboards/seller-centre/verification/page';
import { VerifiedSeal } from '../verified-seal';

interface VerificationStatusSidebarProps {
    manufacturerData: ManufacturerData | null;
    forceRefetch: () => void;
}

type ManufacturerData = {
    id: string;
    verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
    rejectionReason?: string;
    verificationSubmittedAt?: any;
};

const statusInfo: Record<
  NonNullable<ManufacturerData['verificationStatus']>,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    badgeVariant: 'secondary' | 'default' | 'destructive' | 'outline';
  }
> = {
  Unsubmitted: { icon: <Info className="h-4 w-4" />, title: 'Not Submitted', description: 'Fill the form and submit your documents.', badgeVariant: 'outline' },
  'Pending Legal': { icon: <Clock className="h-4 w-4" />, title: 'Pending Legal Review', description: 'Documents are under review.', badgeVariant: 'default' },
  'Pending Admin': { icon: <Clock className="h-4 w-4" />, title: 'Pending Final Approval', description: 'Legal review complete.', badgeVariant: 'default' },
  Verified: { icon: <ShieldCheck className="h-4 w-4" />, title: 'Verified', description: 'Your shop is live and trusted.', badgeVariant: 'secondary' },
  'Action Required': { icon: <AlertTriangle className="h-4 w-4" />, title: 'Action Required', description: 'Review feedback and resubmit.', badgeVariant: 'destructive' },
};

export function VerificationStatusSidebar({ manufacturerData, forceRefetch }: VerificationStatusSidebarProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);

    const { handleSubmit, formState: { isValid } } = useFormContext<VerificationFormData>();
    
    const handleSubmitForVerification = async (formData: VerificationFormData) => {
        if (!manufacturerData?.id) return;
        
        const manufDocRef = doc(firestore, 'manufacturers', manufacturerData.id);
        
        setIsSaving(true);
        
        try {
            const dataToSave = {
                ...formData,
                phone: formData.phone,
                kraPin: formData.kraPin,
                verificationStatus: 'Pending Legal',
                verificationSubmittedAt: serverTimestamp(),
            };

            await updateDocumentNonBlocking(manufDocRef, dataToSave);
            
            toast({
                title: 'Submission Successful!',
                description: 'Your verification documents have been submitted for review.',
            });
            forceRefetch();
        } catch (error: any) {
             toast({
                title: 'Submission Failed',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const currentStatusKey = manufacturerData?.verificationStatus || 'Unsubmitted';
    const currentStatus = statusInfo[currentStatusKey];
    const canSubmit = currentStatusKey === 'Unsubmitted' || currentStatusKey === 'Action Required';

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle>Submission Status</CardTitle>
                <CardDescription>Your current verification progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <Badge variant={currentStatus.badgeVariant}>{currentStatus.title}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentStatus.description}</p>
                {manufacturerData?.verificationSubmittedAt && (
                     <div>
                        <p className="text-sm text-muted-foreground">Last Submitted</p>
                        <p className="font-semibold">{new Date(manufacturerData.verificationSubmittedAt.seconds * 1000).toLocaleString()}</p>
                    </div>
                )}
                 {currentStatusKey === 'Action Required' && manufacturerData.rejectionReason && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Feedback from Admin</AlertTitle>
                        <AlertDescription>{manufacturerData.rejectionReason}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                 {canSubmit && (
                    <Button onClick={handleSubmit(handleSubmitForVerification)} className="w-full" disabled={isSaving || !isValid}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        {currentStatusKey === 'Action Required' ? 'Resubmit for Verification' : 'Submit for Verification'}
                    </Button>
                )}
                 {currentStatusKey === 'Verified' && (
                    <div className="w-full text-center text-sm text-green-600 font-semibold flex flex-col items-center justify-center gap-2">
                         <VerifiedSeal size={48} />
                         Shop Verified
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
