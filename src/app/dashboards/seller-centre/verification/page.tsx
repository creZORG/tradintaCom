
'use client';

import React from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  ChevronLeft,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { BusinessDetailsForm } from '@/components/verification/BusinessDetailsForm';
import { LegalDocumentsForm } from '@/components/verification/LegalDocumentsForm';
import { VerificationStatusSidebar } from '@/components/verification/VerificationStatusSidebar';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton';


// Define the validation schema for the entire form
const verificationSchema = z.object({
  shopName: z.string().min(3, 'Business name is required.'),
  ownerName: z.string().min(3, 'Owner name is required.'),
  phone: z.string().regex(/^\d{10,15}$/, 'Please enter a valid phone number.'),
  address: z.string().min(10, 'A valid address is required.'),
  businessLicenseNumber: z.string().min(3, 'Business registration number is required.'),
  kraPin: z.string().length(11, 'KRA PIN must be 11 characters.'),
  certUrl: z.string().url('Please upload your Certificate of Incorporation.'),
  kraPinUrl: z.string().url('Please upload your KRA PIN certificate.'),
  ownerIdUrl: z.string().url('Please upload your ID document.'),
});

export type VerificationFormData = z.infer<typeof verificationSchema>;

type ManufacturerData = {
    verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
    shopName?: string;
    ownerName?: string;
    phone?: string;
    address?: string;
    businessLicenseNumber?: string;
    kraPin?: string;
    certUrl?: string;
    kraPinUrl?: string;
    ownerIdUrl?: string;
}

export default function VerificationPage() {
    const { user } = useUser();

    const methods = useForm<VerificationFormData>({
      resolver: zodResolver(verificationSchema),
      mode: 'onBlur',
    });

    const firestore = useFirestore();
    const manufDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'manufacturers', user.uid);
    }, [user, firestore]);
    
    const { data: manufacturerData, isLoading, forceRefetch } = useDoc<ManufacturerData>(manufDocRef);
    
    // Populate form with fetched data
    React.useEffect(() => {
        if(manufacturerData) {
            methods.reset({
                shopName: manufacturerData.shopName || '',
                ownerName: manufacturerData.ownerName || '',
                phone: manufacturerData.phone || '',
                address: manufacturerData.address || '',
                businessLicenseNumber: manufacturerData.businessLicenseNumber || '',
                kraPin: manufacturerData.kraPin || '',
                certUrl: manufacturerData.certUrl || '',
                kraPinUrl: manufacturerData.kraPinUrl || '',
                ownerIdUrl: manufacturerData.ownerIdUrl || '',
            });
        }
    }, [manufacturerData, methods]);
    
    const isVerified = manufacturerData?.verificationStatus === 'Verified';

    if (isLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 grid gap-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="lg:col-span-1">
                         <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <div>Please log in to access this page.</div>
    }

    return (
        <FormProvider {...methods}>
            <div className="space-y-6">
                 <Breadcrumb>
                    <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboards/seller-centre">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Business Verification</BreadcrumbPage>
                    </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/dashboards/seller-centre">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                        Business Verification
                    </h1>
                </div>

                 <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 grid gap-8">
                       <BusinessDetailsForm disabled={isVerified} />
                       <LegalDocumentsForm disabled={isVerified} />
                    </div>
                     <div className="lg:col-span-1">
                        <VerificationStatusSidebar manufacturerData={manufacturerData} forceRefetch={forceRefetch} />
                    </div>
                </div>
            </div>
        </FormProvider>
    );
}
