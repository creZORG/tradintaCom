
'use client';

import * as React from 'react';
import { useAuth, useUser } from '@/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { resendOtp, verifyLoginOtpAndGrantSession } from '@/lib/otp';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface OtpGateProps {
  onSuccess: () => void;
}

const MAX_RESEND_ATTEMPTS = 3;

export function OtpGate({ onSuccess }: OtpGateProps) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [otp, setOtp] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendCount, setResendCount] = React.useState(0);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || otp.length !== 6) return;

    setIsLoading(true);
    const result = await verifyLoginOtpAndGrantSession(user.uid, otp);

    if (result.success) {
      toast({ title: 'Success!', description: result.message });
      onSuccess();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      setIsLoading(false);
    }
  };
  
  const handleResend = async () => {
    if (!user || !user.email) return;
    
    setIsResending(true);
    const result = await resendOtp(user.uid, user.email, user.displayName || 'User');
    setResendCount(prev => prev + 1);

    if (result.success) {
        toast({ title: 'Code Sent', description: result.message });
    } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsResending(false);
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-background p-8 shadow-2xl">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-bold font-headline">
            Verify Your Device
          </h1>
          <p className="mt-2 text-muted-foreground">
            For your security, we've sent a 6-digit verification code to{' '}
            <span className="font-semibold text-foreground">{user?.email}</span>.
          </p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-2xl tracking-[0.5em]"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Continue
          </Button>
        </form>
        <div className="flex justify-between items-center text-sm">
            <Button variant="link" onClick={handleResend} disabled={isResending || resendCount >= MAX_RESEND_ATTEMPTS} className="p-0 h-auto">
                 {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {resendCount >= MAX_RESEND_ATTEMPTS ? "Resend limit reached" : "Resend Code"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4"/> Log Out
            </Button>
        </div>
      </div>
    </div>
  );
}
