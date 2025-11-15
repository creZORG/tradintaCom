

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { verifyEmailToken } from '@/app/lib/actions/auth';
import { useUser } from '@/firebase';

function VerifyEmailComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: loggedInUser } = useUser(); // Get the currently logged-in user session
  
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{success: boolean, message: string, verifiedUserId?: string} | null>(null);
  
  useEffect(() => {
    const checkToken = async () => {
        if (!token) {
            setVerificationResult({ success: false, message: 'Invalid or missing verification token. Please request a new link.' });
            setIsVerifying(false);
            return;
        }
        const result = await verifyEmailToken(token);
        
        // Security check: If a user is logged in, ensure the token matches their ID
        if (result.success && loggedInUser && result.verifiedUserId !== loggedInUser.uid) {
            setVerificationResult({ 
                success: false, 
                message: 'This verification link is for a different account. Please log out and try again, or check your email for the correct link.' 
            });
        } else {
            setVerificationResult(result);
        }

        setIsVerifying(false);
        
        if (result.success) {
            toast({
                title: 'Success!',
                description: result.message,
            });
        }
    };
    checkToken();
  }, [token, toast, loggedInUser]);

  if (isVerifying) {
    return (
        <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Verifying your email...</h2>
            <p className="mt-2 text-muted-foreground">Please wait a moment.</p>
        </div>
    );
  }

  if (verificationResult?.success) {
     return (
        <div className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-lg font-semibold">Email Verified!</h2>
            <p className="mt-2 text-muted-foreground">{verificationResult.message}</p>
            <Button asChild className="mt-6">
                <Link href="/login">Proceed to Login</Link>
            </Button>
        </div>
    );
  }
  
   if (!verificationResult?.success) {
     return (
        <div className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold">Verification Failed</h2>
            <p className="mt-2 text-muted-foreground">{verificationResult?.message || 'An unknown error occurred.'}</p>
            <Button asChild className="mt-6">
                <Link href="/login">Back to Login</Link>
            </Button>
        </div>
    );
  }

  return null;
}


export default function VerifyEmailPage() {
    return (
         <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-md space-y-8">
                <Logo className="w-40 mb-6 mx-auto" />
                <Suspense fallback={<Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}>
                    <VerifyEmailComponent />
                </Suspense>
            </div>
        </div>
    );
}
