
'use client';

import * as React from 'react';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Gem, Award, Rocket, Crown, TrendingUp, Handshake, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { MARKETING_FEATURES } from '@/lib/marketing-features';
import Link from 'next/link';
import Image from 'next/image';

type MarketingPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  isPopular?: boolean;
  goal?: string;
  requiresSalesContact?: boolean;
};

const planIcons: Record<string, React.ReactNode> = {
    lift: <TrendingUp className="w-8 h-8 text-primary" />,
    flow: <Award className="w-8 h-8 text-primary" />,
    surge: <Rocket className="w-8 h-8 text-primary" />,
    apex: <Gem className="w-8 h-8 text-primary" />,
    infinity: <Crown className="w-8 h-8 text-primary" />,
};

export default function MarketingPlansPage() {
    const firestore = useFirestore();

    const plansQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'marketingPlans')) : null, [firestore]);
    const { data: plans, isLoading: isLoadingPlans } = useCollection<MarketingPlan>(plansQuery);

    const featureTextsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'marketingFeatureTexts') : null, [firestore]);
    const { data: featureTexts, isLoading: isLoadingTexts } = useDoc(featureTextsRef);

    const isLoading = isLoadingPlans || isLoadingTexts;

    const getFeatureText = (key: string) => {
        return featureTexts?.[key] || MARKETING_FEATURES.flatMap(g => g.features).find(f => f.key === key)?.defaultText || key;
    }

    const renderPlanCard = (plan: MarketingPlan) => {
        const shopFeatures = plan.features?.filter(f => f.startsWith('shop:')) || [];
        const productFeatures = plan.features?.filter(f => f.startsWith('product:')) || [];

        return (
            <Card key={plan.id} className={`flex flex-col h-full ${plan.isPopular ? 'lg:scale-105 lg:shadow-2xl z-10 border-primary' : ''}`}>
                <CardHeader className="text-center items-center">
                    {plan.isPopular && <Badge className="absolute -top-3">Most Popular</Badge>}
                    <div className="p-4 bg-primary/10 rounded-full mb-2">
                        {planIcons[plan.id] || <TrendingUp className="w-8 h-8 text-primary" />}
                    </div>
                    <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="font-semibold text-primary h-6">
                        {plan.price > 0 ? `KES ${plan.price.toLocaleString()}` : 'Custom Pricing'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-center text-muted-foreground mb-6 min-h-[40px]">{plan.goal}</p>

                    <div className="space-y-4">
                        {shopFeatures.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Shop-Level Boosts:</h4>
                                <ul className="space-y-3">
                                    {shopFeatures.map(key => (
                                        <li key={key} className="flex items-start gap-3">
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                            <span className="text-xs text-foreground">{getFeatureText(key)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {productFeatures.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Product-Level Promotions:</h4>
                                <ul className="space-y-3">
                                    {productFeatures.map(key => (
                                        <li key={key} className="flex items-start gap-3">
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                            <span className="text-xs text-foreground">{getFeatureText(key)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                     <Button asChild className="w-full">
                         {plan.requiresSalesContact ? (
                            <a href="mailto:sales@tradinta.com">Contact Sales</a>
                         ) : (
                            <Link href={`/subscribe/${plan.id}`}>Choose Plan</Link>
                         )}
                    </Button>
                </CardFooter>
            </Card>
        );
    }
    
    const renderSkeletonCard = () => (
         <Card className="flex flex-col h-full">
            <CardHeader className="text-center items-center">
                <Skeleton className="w-16 h-16 rounded-full mb-2" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full mb-6" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                 <div className="space-y-4">
                    <div>
                        <Skeleton className="h-5 w-20 mb-2" />
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                 </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Tradinta Growth Tiers</h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Choose a unified plan to boost your shop and products. All sellers get free B2B features—these plans are for growth.
                </p>
            </div>
            
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start justify-center">
                {isLoading ? (
                    <>
                        {renderSkeletonCard()}
                        {renderSkeletonCard()}
                        {renderSkeletonCard()}
                    </>
                ) : plans && plans.length > 0 ? (
                    plans.sort((a,b) => a.price - b.price).map(plan => renderPlanCard(plan))
                ) : (
                    <div className="col-span-full text-center py-16">
                        <p>Marketing plans are being updated. Please check back soon.</p>
                    </div>
                )}
            </section>

             <section className="mt-20">
                <Card className="bg-gradient-to-r from-blue-500 to-orange-500 text-primary-foreground">
                    <div className="grid md:grid-cols-2 items-center">
                        <div className="p-8 md:p-12">
                            <h2 className="text-3xl font-bold font-headline mb-4">Growth Partner Marketplace</h2>
                            <p className="mb-6 opacity-90">Looking for a more direct approach? Collaborate with vetted influencers and content creators to promote your brand. Negotiate custom deals for video reviews, social media shoutouts, and more.</p>
                            <Button variant="secondary" asChild>
                                <Link href="/partners">Browse Partner Marketplace <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                        <div className="relative h-64 md:h-full hidden md:block">
                             <Image src="https://picsum.photos/seed/influencer-cta/800/600" alt="Influencer collaborating with a brand" fill className="object-cover rounded-r-lg" />
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
}
