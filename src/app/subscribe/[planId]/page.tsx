
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Gem, Award, Rocket, Crown, TrendingUp, Wallet, Loader2, ArrowLeft } from "lucide-react";
import { usePaystackPayment } from 'react-paystack';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { MARKETING_FEATURES } from '@/lib/marketing-features';


type MarketingPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  goal?: string;
};

const planIcons: Record<string, React.ReactNode> = {
    lift: <TrendingUp className="w-8 h-8 text-primary" />,
    flow: <Award className="w-8 h-8 text-primary" />,
    surge: <Rocket className="w-8 h-8 text-primary" />,
    apex: <Gem className="w-8 h-8 text-primary" />,
    infinity: <Crown className="w-8 h-8 text-primary" />,
};

const PayButton = ({ plan }: { plan: MarketingPlan }) => {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const config = {
        reference: new Date().getTime().toString(),
        email: user?.email || '',
        amount: plan.price * 100, // Paystack amount is in kobo/cents
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        currency: 'KES', // Specify Kenyan Shillings
        metadata: {
            planId: plan.id,
            userId: user?.uid,
            custom_fields: [
                {
                    display_name: "Plan Name",
                    variable_name: "plan_name",
                    value: plan.name
                }
            ]
        }
    };

    const initializePayment = usePaystackPayment(config);

    const onSuccess = async (transaction: any) => {
        toast({ title: "Payment Successful!", description: "Verifying and activating your subscription..."});
        
        try {
            const response = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference: transaction.reference,
                    planId: plan.id,
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.details || 'Subscription activation failed on the server.');
            }
            
            toast({
                title: "Subscription Activated!",
                description: `You have successfully subscribed to the ${plan.name} plan.`,
            });
            router.push('/dashboards/seller-centre/marketing');

        } catch (error: any) {
             toast({
                title: "Subscription Activation Failed",
                description: `Your payment was successful, but we couldn't activate your subscription. Please contact support with transaction reference: ${transaction.reference}. Error: ${error.message}`,
                variant: 'destructive',
                duration: 10000,
            });
        }
    };

    const onClose = () => {
        toast({
            title: "Payment Cancelled",
            description: "You have not been charged.",
            variant: "default",
        })
    };

    return (
        <Button size="lg" className="w-full" onClick={() => initializePayment(onSuccess, onClose)}>
            <Wallet className="mr-2 h-5 w-5" /> Confirm &amp; Pay with Paystack
        </Button>
    )
};


export default function SubscribePage() {
  const params = useParams();
  const planId = params.planId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const planDocRef = useMemoFirebase(() => {
    if (!firestore || !planId) return null;
    return doc(firestore, 'marketingPlans', planId);
  }, [firestore, planId]);

  const { data: plan, isLoading } = useDoc<MarketingPlan>(planDocRef);

  const featureTextsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'marketingFeatureTexts') : null, [firestore]);
  const { data: featureTexts, isLoading: isLoadingTexts } = useDoc(featureTextsRef);

  const getFeatureText = (key: string) => {
    return featureTexts?.[key] || MARKETING_FEATURES.flatMap(g => g.features).find(f => f.key === key)?.defaultText || key;
  }

  if (isLoading || isLoadingTexts) {
    return (
        <div className="container mx-auto py-12 max-w-2xl">
             <div className="flex items-center gap-4 mb-8">
                 <Skeleton className="h-9 w-9" />
                 <Skeleton className="h-6 w-48" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-5 w-1/3" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-40 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-12 w-full" />
                </CardFooter>
            </Card>
        </div>
    )
  }

  if (!plan) {
    return (
        <div className="container mx-auto py-12 text-center">
            <h1 className="text-xl font-semibold">Plan Not Found</h1>
            <p>The marketing plan you are looking for does not exist.</p>
            <Button asChild className="mt-4"><Link href="/marketing-plans">View Plans</Link></Button>
        </div>
    )
  }

  const shopFeatures = plan.features?.filter(f => f.startsWith('shop:')) || [];
  const productFeatures = plan.features?.filter(f => f.startsWith('product:')) || [];

  return (
    <div className="container mx-auto py-12 max-w-2xl">
         <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                <Link href="/marketing-plans">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back to Plans</span>
                </Link>
            </Button>
            <h1 className="text-2xl font-bold font-headline">Confirm Your Subscription</h1>
        </div>
        <Card>
            <CardHeader className="text-center items-center pb-4">
                <div className="p-4 bg-primary/10 rounded-full mb-2">
                    {planIcons[plan.id] || <TrendingUp className="w-8 h-8 text-primary" />}
                </div>
                <CardTitle className="font-headline text-2xl">You are subscribing to {plan.name}</CardTitle>
                <CardDescription className="font-bold text-3xl text-primary pt-2">
                    KES {plan.price.toLocaleString()} / month
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-center text-muted-foreground mb-6">{plan.goal}</p>
                <div className="space-y-4 text-sm">
                    {(shopFeatures.length > 0 || productFeatures.length > 0) && (
                        <div>
                            <h4 className="font-semibold mb-2">Features Included:</h4>
                            <ul className="space-y-2">
                                {[...shopFeatures, ...productFeatures].map(key => (
                                    <li key={key} className="flex items-start gap-3">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{getFeatureText(key)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                {user ? (
                    <PayButton plan={plan} />
                ) : (
                    <Button disabled size="lg" className="w-full">Please log in to purchase</Button>
                )}
                <p className="text-xs text-muted-foreground">You will be redirected to Paystack to complete your payment.</p>
            </CardFooter>
        </Card>
    </div>
  );
}
