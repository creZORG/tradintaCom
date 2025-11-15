'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Edit, Save, Loader2, UserPlus, ShoppingCart, Star, ShieldCheck, UploadCloud, TrendingUp } from "lucide-react";

const buyerEarningRuleDefs = [
  { id: 'buyerSignupPoints', action: 'Sign Up & Verify Email', icon: <UserPlus className="w-5 h-5 text-primary" />, description: "One-time reward for joining the platform." },
  { id: 'buyerPurchasePointsPer10', action: 'Make a Purchase', icon: <ShoppingCart className="w-5 h-5 text-primary" />, description: "Points earned per KES 10 spent." },
  { id: 'buyerReviewPoints', action: 'Write a Product Review', icon: <Star className="w-5 h-5 text-primary" />, description: "Reward for reviewing a purchased product." },
  { id: 'buyerReferralPoints', action: 'Refer a New User', icon: <UserPlus className="w-5 h-5 text-primary" />, description: "Awarded when your referral verifies their account." },
];

const sellerEarningRuleDefs = [
    { id: 'sellerVerificationPoints', action: 'Complete Profile Verification', icon: <ShieldCheck className="w-5 h-5 text-primary" />, description: 'One-time reward for becoming a "Verified" seller.' },
    { id: 'sellerSalePointsPer10', action: 'Make a Sale', icon: <ShoppingCart className="w-5 h-5 text-primary" />, description: 'Points earned per KES 10 of sale value.' },
    { id: 'sellerFirstProductPoints', action: 'Publish First Product', icon: <UploadCloud className="w-5 h-5 text-primary" />, description: "Awarded when the first product goes live." },
    { id: 'sellerFiveStarReviewPoints', action: 'Receive a 5-Star Review', icon: <Star className="w-5 h-5 text-primary" />, description: "Reward for each 5-star review received from a verified buyer." },
];

type PointsConfig = {
    pointsConfig?: {
        buyerSignupPoints?: number;
        buyerPurchasePointsPer10?: number;
        buyerReviewPoints?: number;
        buyerReferralPoints?: number;
        sellerVerificationPoints?: number;
        sellerSalePointsPer10?: number;
        sellerFirstProductPoints?: number;
        sellerFiveStarReviewPoints?: number;
        globalSellerPointMultiplier?: number;
    }
}

export default function PointsRulesManager() {
    const [isEditing, setIsEditing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const pointsConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'config') : null, [firestore]);
    const { data: pointsConfig, isLoading } = useDoc<PointsConfig>(pointsConfigRef);
    
    const [rules, setRules] = React.useState<Record<string, number>>({});
    
    React.useEffect(() => {
        if (pointsConfig?.pointsConfig) {
            const pc = pointsConfig.pointsConfig;
            setRules({
                buyerSignupPoints: pc.buyerSignupPoints || 50,
                buyerPurchasePointsPer10: pc.buyerPurchasePointsPer10 || 1,
                buyerReviewPoints: pc.buyerReviewPoints || 15,
                buyerReferralPoints: pc.buyerReferralPoints || 100,
                sellerVerificationPoints: pc.sellerVerificationPoints || 150,
                sellerSalePointsPer10: pc.sellerSalePointsPer10 || 1,
                sellerFirstProductPoints: pc.sellerFirstProductPoints || 25,
                sellerFiveStarReviewPoints: pc.sellerFiveStarReviewPoints || 10,
                globalSellerPointMultiplier: pc.globalSellerPointMultiplier || 1,
            });
        }
    }, [pointsConfig]);
    
    const handleRuleChange = (id: string, value: string) => {
        setRules(prev => ({ ...prev, [id]: Number(value) }));
    };
    
    const handleSaveRules = async () => {
        if (!pointsConfigRef) return;
        setIsSaving(true);
        try {
            const dataToSave = { pointsConfig: rules };
            await setDocumentNonBlocking(pointsConfigRef, dataToSave, { merge: true });
            toast({ title: "Success", description: "Points earning rules have been updated." });
            setIsEditing(false);
        } catch (error: any) {
            toast({ title: "Error", description: "Could not save rules: " + error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
         <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Points Earning Rules</CardTitle>
                            <CardDescription>Define how users are awarded TradPoints for their actions.</CardDescription>
                        </div>
                        <Button onClick={isEditing ? handleSaveRules : () => setIsEditing(true)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Saving...' : isEditing ? 'Save Rules' : 'Edit Rules'}
                        </Button>
                    </div>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Buyer Earning Rules</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-20 w-full" />) :
                        buyerEarningRuleDefs.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center gap-4">
                                    {rule.icon}
                                    <div>
                                        <p className="font-semibold">{rule.action}</p>
                                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <Input type="number" value={rules[rule.id] || 0} onChange={(e) => handleRuleChange(rule.id, e.target.value)} className="w-24 h-9" />
                                    ) : (
                                        <p className="font-bold text-lg">{rules[rule.id] || 0}</p>
                                    )}
                                    <span className="text-muted-foreground">Points</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Seller Earning Rules</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-20 w-full" />) :
                        sellerEarningRuleDefs.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center gap-4">
                                    {rule.icon}
                                    <div>
                                        <p className="font-semibold">{rule.action}</p>
                                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <Input type="number" value={rules[rule.id] || 0} onChange={(e) => handleRuleChange(rule.id, e.target.value)} className="w-24 h-9" />
                                    ) : (
                                        <p className="font-bold text-lg">{rules[rule.id] || 0}</p>
                                    )}
                                    <span className="text-muted-foreground">Points</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Global Boost Settings</CardTitle>
                        <CardDescription>Apply platform-wide multipliers to incentivize specific user groups.</CardDescription>
                </CardHeader>
                <CardContent>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-semibold">Global Seller Point Multiplier</p>
                                <p className="text-sm text-muted-foreground">Boosts points earned from sales for all "Verified" sellers. Default is 1 (no boost).</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <Input type="number" step="0.1" value={rules['globalSellerPointMultiplier'] || 1} onChange={(e) => handleRuleChange('globalSellerPointMultiplier', e.target.value)} className="w-24 h-9" />
                            ) : (
                                <p className="font-bold text-lg">{rules['globalSellerPointMultiplier'] || 1}x</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
