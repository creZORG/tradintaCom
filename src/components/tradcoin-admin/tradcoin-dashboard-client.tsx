'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ChevronRight, Loader2, RefreshCw, Sparkles, Gift, Check, Ticket, Hash, AlertTriangle, ArrowRight, UserPlus, ShoppingCart, Star, ShieldCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import AirdropOverview from '@/components/tradcoin-admin/AirdropOverview';
import PointsRulesManager from '@/components/tradcoin-admin/PointsRulesManager';
import UserPointsManager from '@/components/tradcoin-admin/UserPointsManager';
import { Button } from '../ui/button';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { reconcileUserPoints } from '@/app/lib/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { claimCodeAction } from '@/app/dashboards/tradcoin-airdrop/actions';


type PointsLedgerEvent = {
    id: string;
    points: number;
    action: string;
    reason_code: string;
    created_at: any;
    metadata?: Record<string, any>;
};

type ReferredUser = {
  emailVerified: boolean;
};

type PointsConfig = {
    buyerSignupPoints?: number;
    buyerPurchasePointsPer10?: number;
    buyerReviewPoints?: number;
    buyerReferralPoints?: number;
}

type UserProfile = {
    tradintaId: string;
    tradPointsStatus?: {
        isBanned: boolean;
        banReason: string;
    }
}


const NavLink = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md w-full text-left",
            active ? "bg-muted text-primary" : "hover:bg-muted/50"
        )}
    >
        {children}
        <ChevronRight className={cn("h-4 w-4 transition-transform", active ? "transform translate-x-1" : "")} />
    </button>
);


export function TradCoinAirdropDashboardContent() {
    const { user, isUserLoading, forceRefetch: forceRefetchUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isReconciling, setIsReconciling] = React.useState(false);

    const userDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userDocRef);

    const platformSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'config') : null, [firestore]);
    const { data: platformSettings, isLoading: isLoadingSettings } = useDoc<{pointsConfig?: PointsConfig, enablePointsSystem?: boolean}>(platformSettingsRef);
    const pointsConfig = platformSettings?.pointsConfig;
    const isPointsSystemEnabled = platformSettings?.enablePointsSystem !== false;
    
    // --- Start: Claim Code Logic ---
    const [claimCode, setClaimCode] = React.useState('');
    const [isClaiming, setIsClaiming] = React.useState(false);
    
    const handleClaimCode = async () => {
        if (!claimCode.trim() || !user) {
            toast({ title: 'Please enter a code.', variant: 'destructive' });
            return;
        }
        setIsClaiming(true);
        try {
            const result = await claimCodeAction(user.uid, claimCode);
            if (result.success) {
                toast({ title: 'Success!', description: result.message });
                setClaimCode('');
                // Force a refetch of the ledger to show the new points
                forceRefetchLedger();
            } else {
                toast({ title: 'Claim Failed', description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setIsClaiming(false);
        }
    };
    // --- End: Claim Code Logic ---

    const waysToEarn = React.useMemo(() => {
        if (!pointsConfig) {
            return []; // Or return a default structure with loading state
        }
        return [
            { icon: <UserPlus className="w-5 h-5 text-primary" />, title: 'Sign Up & Verify Email', points: `${pointsConfig.buyerSignupPoints || 0} Points`, description: 'One-time reward for joining the platform.' },
            { icon: <ShoppingCart className="w-5 h-5 text-primary" />, title: 'Make a Purchase', points: `${pointsConfig.buyerPurchasePointsPer10 || 0} Point${pointsConfig.buyerPurchasePointsPer10 === 1 ? '' : 's'} per KES 10 spent`, description: 'Earn points for every KES spent on orders from Verified sellers.' },
            { icon: <Star className="w-5 h-5 text-primary" />, title: 'Write a Review', points: `${pointsConfig.buyerReviewPoints || 0} Points`, description: 'Get rewarded for reviewing a product you purchased.' },
            { icon: <UserPlus className="w-5 h-5 text-primary" />, title: 'Refer a Friend', points: `${pointsConfig.buyerReferralPoints || 0} Points`, description: 'Awarded when your referral signs up and verifies their email.' },
        ];
    }, [pointsConfig]);

    const ledgerQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'pointsLedgerEvents'), 
            where('user_id', '==', user.uid),
            orderBy('created_at', 'desc'),
            limit(50)
        );
    }, [user, firestore]);
    const { data: ledgerEvents, isLoading: isLoadingLedger, forceRefetch: forceRefetchLedger } = useCollection<PointsLedgerEvent>(ledgerQuery);

    const referralsQuery = useMemoFirebase(() => {
        if (!userProfile?.tradintaId) return null;
        return query(collection(firestore, 'users'), where('referredBy', '==', userProfile.tradintaId));
    }, [userProfile, firestore]);
    const { data: referrals, isLoading: isLoadingReferrals } = useCollection<ReferredUser>(referralsQuery);
    
    React.useEffect(() => {
        if (user && !isReconciling && !isLoadingProfile && isPointsSystemEnabled) {
            handleReconcile();
        }
    }, [user, isLoadingProfile, isPointsSystemEnabled]);
    
    const totalPoints = React.useMemo(() => {
        if (!ledgerEvents) return 0;
        return ledgerEvents.reduce((sum, event) => sum + event.points, 0);
    }, [ledgerEvents]);

    const referralStats = React.useMemo(() => {
        if (!referrals) return { verified: 0, unverified: 0 };
        return {
        verified: referrals.filter(r => r.emailVerified).length,
        unverified: referrals.filter(r => !r.emailVerified).length,
        };
    }, [referrals]);
    
    const handleReconcile = async () => {
        if (!user) return;
        setIsReconciling(true);
        try {
            const result = await reconcileUserPoints(user.uid);
            if(result.success && result.pointsAwarded > 0) {
                toast({
                    title: "Reconciliation Complete!",
                    description: result.message,
                });
                 forceRefetchLedger();
            }
        } catch (error: any) {
            toast({ title: 'Error Reconciling Points', description: error.message, variant: 'destructive' });
        } finally {
            setIsReconciling(false);
        }
    };

    const renderLedgerRows = () => {
        const isLoading = isLoadingLedger || isLoadingProfile;
        if (isLoading) {
            return Array.from({length: 4}).map((_, i) => (
                <TableRow key={`skel-row-${i}`}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                </TableRow>
            ));
        }
        if (!ledgerEvents || ledgerEvents.length === 0) {
            return <TableRow><TableCell colSpan={3} className="text-center h-24">No points history yet.</TableCell></TableRow>;
        }
        return ledgerEvents.map(event => (
            <TableRow key={event.id}>
                <TableCell>
                    <p className="font-medium capitalize">{event.reason_code.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{event.created_at ? new Date(event.created_at.seconds * 1000).toLocaleString() : ''}</p>
                </TableCell>
                <TableCell className={`font-semibold text-right ${event.points > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {event.points > 0 ? `+${event.points}` : event.points}
                </TableCell>
                <TableCell>
                    <Badge variant={event.action === 'award' ? 'secondary' : 'outline'}>
                        {event.action}
                    </Badge>
                </TableCell>
            </TableRow>
        ));
    };
    
    if (userProfile?.tradPointsStatus?.isBanned) {
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                        Participation Suspended
                    </CardTitle>
                    <CardDescription>Your account has been restricted from the TradPoints program.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold">Reason:</p>
                    <p className="text-muted-foreground">{userProfile.tradPointsStatus.banReason || 'Violation of program policies.'}</p>
                </CardContent>
                <CardFooter className="flex-col">
                    <p className="text-xs text-muted-foreground">If you believe this is an error, please contact support.</p>
                    <Button asChild variant="link" className="mt-2"><Link href="/dashboards/support">Contact Support</Link></Button>
                </CardFooter>
            </Card>
        </div>
        )
    }

    return (
        <div className="space-y-6">
        <Breadcrumb>
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                <Link href="/dashboards/buyer">Dashboard</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>TradPoints</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <Card>
            <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                    <Coins className="w-6 h-6 text-primary" />
                    My TradPoints
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleReconcile} disabled={isReconciling || !isPointsSystemEnabled}>
                    {isReconciling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Sync My Points
                </Button>
            </div>
            <CardDescription>
                Your rewards hub. Earn points for your activity on Tradinta.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(isLoadingLedger || isLoadingProfile) ? <Skeleton className="h-8 w-32" /> : (
                            <div className="text-3xl font-bold flex items-center gap-2">
                            {totalPoints.toLocaleString()} <span className="text-lg text-muted-foreground">Points</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(isLoadingReferrals || isLoadingProfile) ? <Skeleton className="h-8 w-24" /> : (
                        <div className="flex items-end gap-4">
                                <div className="text-3xl font-bold">{referralStats.verified + referralStats.unverified}</div>
                                <div className="text-sm space-x-2">
                                    <Badge className="bg-green-100 text-green-800">{referralStats.verified} Verified</Badge>
                                    <Badge className="bg-yellow-100 text-yellow-800">{referralStats.unverified} Pending</Badge>
                                </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4"/>The Future is $TRAD</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">TradPoints are the foundation of our ecosystem. Soon, they will be convertible to <span className="font-bold text-foreground">TradCoin ($TRAD)</span>, the official token of Tradinta.</p>
                        <Button variant="outline" size="sm" className="mt-4" asChild>
                            <a href="http://trad.co.ke" target="_blank" rel="noopener noreferrer">
                                Learn More at trad.co.ke <ArrowRight className="ml-2 w-4 h-4"/>
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
        
        {!isPointsSystemEnabled && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>TradPoints System Disabled</AlertTitle>
            <AlertDescription>
                The points earning system is currently undergoing maintenance. Points cannot be earned or redeemed at this time.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Ways to Earn</CardTitle>
                        <CardDescription>Complete tasks to earn more points.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(isLoadingSettings || isUserLoading) ? (
                            Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                        ) : (
                            waysToEarn.map(item => (
                                <div key={item.title} className="flex items-start gap-4">
                                    <div>{item.icon}</div>
                                    <div>
                                        <p className="font-semibold">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                        <Badge variant="outline" className="mt-1">{item.points}</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Ticket /> Redeem a Claim Code</CardTitle>
                        <CardDescription>Enter an 8-digit code from a promotion to claim your points.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input placeholder="ABC-1234" value={claimCode} onChange={e => setClaimCode(e.target.value)} />
                            <Button onClick={handleClaimCode} disabled={isClaiming}>
                                {isClaiming ? <Loader2 className="h-4 w-4 animate-spin"/> : "Claim"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Points History</CardTitle>
                        <CardDescription>A complete ledger of your points transactions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Activity</TableHead>
                                    <TableHead className="text-right">Points</TableHead>
                                    <TableHead>Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderLedgerRows()}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
        </div>
    );
}
