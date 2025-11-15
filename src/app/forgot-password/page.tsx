

'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Mail, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { handleRequestPasswordReset } from '@/app/lib/actions/auth';


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  
  const initialState = { message: '', success: false };
  const [state, dispatch] = useActionState(handleRequestPasswordReset, initialState);
  const isEmailSent = state.success;

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
       <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-8">
            <Logo className="w-40 mb-6" />
            
            {isEmailSent ? (
                <div className="text-center">
                    <Mail className="mx-auto h-12 w-12 text-green-500" />
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                        Check your email
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {state.message}
                    </p>
                     <Button asChild className="mt-6">
                        <Link href="/login">
                           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                        </Link>
                    </Button>
                </div>
            ) : (
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 font-headline">
                        Forgot Your Password?
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        No worries. Enter your email address and we'll send you a link to reset it.
                    </p>
                    <form action={dispatch}>
                        <div className="relative mt-8 space-y-6">
                            <div className="relative">
                                <Label htmlFor="email">Email</Label>
                                <Mail className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="mt-1 pl-10"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <Button type="submit" className="w-full">
                                    Send Reset Link
                                </Button>
                            </div>
                            {state.message && !state.success && (
                                <p className="text-sm text-destructive text-center">{state.message}</p>
                            )}
                        </div>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Remember your password?{' '}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                           Back to Login
                        </Link>
                    </p>
                </div>
            )}
        </div>
       </div>
       <div className="relative hidden lg:block">
            <Image
                src="https://picsum.photos/seed/forgot-pw/1200/1800"
                alt="Abstract digital network"
                fill
                className="object-cover"
                data-ai-hint="digital network"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-orange-500/20"></div>
        </div>
    </div>
  );
}
