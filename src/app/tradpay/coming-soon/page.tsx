'use client';

import React, { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { CheckCircle, Mail, Loader2, ArrowRight } from 'lucide-react';
import { addToTradepayWaitlist } from '@/app/tradpay/actions';
import Link from 'next/link';

export default function TradPayComingSoonPage() {
  const [email, setEmail] = useState('');
  
  const initialState = {
    message: '',
    success: false,
    email: '',
  };
  const [state, formAction] = useActionState(addToTradepayWaitlist, initialState);

  const isSubmitted = state.success;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-background text-center p-4">
      <div className="w-full max-w-md">
        <Image
          src="https://i.postimg.cc/xjZhmYGD/image-Photoroom-1-Photoroom.png"
          alt="TradPay Logomark"
          width={96}
          height={96}
          className="mx-auto mb-6"
        />

        {isSubmitted ? (
          <div className="space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="text-3xl font-bold font-headline">{state.message}</h1>
            <p className="text-muted-foreground">
              We'll notify you at{' '}
              <span className="font-semibold text-primary">{state.email}</span> as soon as TradPay is launched.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">
              The Future of B2B Payments is Coming Soon
            </h1>
            <p className="text-muted-foreground md:text-lg">
              TradPay is currently in a limited pilot program. Be the first to
              know when our secure escrow, instant credit, and powerful business
              tools are available to everyone.
            </p>

            <Button asChild variant="link">
                <Link href="/tradpay/about">
                    Learn more about TradPay's features <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>

            <form
              action={formAction}
              className="flex w-full items-center space-x-2 pt-4"
            >
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Notify Me</Button>
            </form>
             {state.message && !state.success && (
                <p className="text-sm text-destructive text-center pt-2">{state.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
