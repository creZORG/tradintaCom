

'use client';

import React, { useState, useEffect, Suspense, useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { handleResetPassword, verifyResetToken } from '@/app/lib/actions/auth';

function ResetPasswordComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const initialState = { message: '', success: false };
  const [state, dispatch] = useActionState(handleResetPassword, initialState);
  
  useEffect(() => {
    const checkToken = async () => {
        if (!token) {
            setVerificationError('Invalid or missing password reset token. Please request a new link.');
            setIsVerifying(false);
            return;
        }
        const result = await verifyResetToken(token);
        if (!result.success) {
            setVerificationError(result.message);
        }
        setIsVerifying(false);
    };
    checkToken();
  }, [token]);
  
  useEffect(() => {
    if (state.success) {
        toast({
            title: 'Success!',
            description: state.message,
        });
        router.push('/login');
    } else if (state.message) {
        toast({
            title: 'Error',
            description: state.message,
            variant: 'destructive',
        });
    }
  }, [state, router, toast]);

  if (isVerifying) {
    return (
        <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Verifying reset link...</h2>
        </div>
    );
  }

  if (verificationError) {
     return (
        <div className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold">Link Invalid</h2>
            <p className="mt-2 text-muted-foreground">{verificationError}</p>
            <Button asChild className="mt-6">
                <Link href="/forgot-password">Request a New Link</Link>
            </Button>
        </div>
    );
  }

  return (
    <>
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 font-headline">
                Create a New Password
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Please enter a new password for your account below.
            </p>
        </div>
        <form action={dispatch}>
            <input type="hidden" name="token" value={token || ''} />
            <div className="mt-8 space-y-6">
                <div className="relative">
                    <Label htmlFor="password">New Password</Label>
                    <KeyRound className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} required className="mt-1 pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[2.4rem] text-muted-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <div className="relative">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <KeyRound className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
                    <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required className="mt-1 pl-10 pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-[2.4rem] text-muted-foreground">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <div>
                    <Button type="submit" className="w-full">
                        Reset Password
                    </Button>
                </div>
            </div>
        </form>
    </>
  )
}


export default function ResetPasswordPage() {
    return (
         <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-md space-y-8">
                <Logo className="w-40 mb-6 mx-auto" />
                <Suspense fallback={<div className="flex justify-center items-center h-48"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /></div>}>
                    <ResetPasswordComponent />
                </Suspense>
            </div>
        </div>
    );
}
