
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Rocket, Sparkles, ArrowRight, Loader2, TrendingUp, Award, Gem, Crown } from "lucide-react";
import Link from 'next/link';

type MarketingPlan = {
  id: string;
  name: string;
};

const planIcons: Record<string, React.ReactNode> = {
    lift: <TrendingUp className="w-8 h-8 text-primary" />,
    flow: <Award className="w-8 h-8 text-primary" />,
    surge: <Rocket className="w-8 h-8 text-primary" />,
    apex: <Gem className="w-8 h-8 text-primary" />,
    infinity: <Crown className="w-8 h-8 text-primary" />,
};

export function SubscriptionSuccessContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get('planId');
    const firestore = useFirestore();

    const planDocRef = useMemoFirebase(() => {
        if (!firestore || !planId) return null;
        return doc(firestore, 'marketingPlans', planId);
    }, [firestore, planId]);

    const { data: plan, isLoading } = useDoc<MarketingPlan>(planDocRef);
    
    if (isLoading) {
        return (
            <div className="container mx-auto py-12 max-w-2xl">
                 <Skeleton className="h-80 w-full" />
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="container mx-auto py-12 text-center">
                <h1 className="text-xl font-semibold">Subscription Information Not Found</h1>
                <p>We couldn't retrieve the details of your subscription. Please check your dashboard to confirm its status.</p>
                <Button asChild className="mt-4"><Link href="/dashboards/seller-centre/marketing">Go to Marketing Dashboard</Link></Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-12 max-w-2xl">
             <Card className="overflow-hidden text-center">
                <div className="p-8 bg-green-50 dark:bg-green-900/20">
                    <Rocket className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold font-headline text-green-700 dark:text-green-300">Subscription Activated!</h1>
                    <p className="text-muted-foreground mt-2">You are now subscribed to the <span className="font-bold">{plan.name}</span> plan.</p>
                </div>
                <CardContent className="p-8 space-y-6">
                    <p>Your new marketing features are now active. You can start boosting your products and reaching more buyers right away.</p>
                    <div className="p-4 bg-muted/50 rounded-md">
                        <h4 className="font-semibold flex items-center justify-center gap-2"><Sparkles className="w-5 h-5 text-primary"/>What's Next?</h4>
                        <ul className="text-sm text-muted-foreground list-none p-0 mt-2 space-y-1">
                            <li>Manage your ad campaigns from your marketing dashboard.</li>
                            <li>See your products automatically get a boost in search results.</li>
                            <li>Look for your new "Premium" badge on your shop page.</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-6">
                     <Button className="w-full" asChild>
                        <Link href="/dashboards/seller-centre/marketing">
                            Go to My Marketing Dashboard <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
