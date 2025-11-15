
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Link as LinkIcon,
  Users,
  DollarSign,
  Loader2,
  Wallet,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Sparkles,
  Settings,
  Table as TableIcon,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, query, where, doc, updateDoc, serverTimestamp, orderBy, getDocs } from 'firebase/firestore';
import { logFeatureUsage } from '@/lib/analytics';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type UserProfile = {
  id: string;
  tradintaId?: string;
  fullName: string;
  photoURL?: string;
  bio?: string;
};

type PartnerEarning = {
    totalEarnings: number;
    unpaidEarnings: number;
    paidEarnings: number;
}

type AttributedSale = {
    id: string;
    orderId: string;
    productName?: string; 
    saleAmount: number;
    commissionEarned: number;
    date: any;
    payoutStatus: 'Unpaid' | 'Paid';
};

type ForgingEvent = {
  id: string;
  productName: string;
  sellerName: string;
  sellerId: string;
  commissionRate: number;
  status: 'proposed' | 'active' | 'finished' | 'declined';
  tiers: { buyers: number; discount: number }[];
};

type Payout = {
    id: string;
    date: any;
    amount: number;
    transactionId: string;
};

export default function GrowthPartnerDashboard() {
  const { user, isUserLoading, role } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedCampaignLink, setCopiedCampaignLink] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user && role) {
      logFeatureUsage({ feature: 'page:view', userId: user.uid, userRole: role, metadata: { page: '/dashboards/growth-partner' } });
    }
  }, [user, role]);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // --- Data Fetching ---
  const earningsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'partnerEarnings', user.uid);
  }, [user, firestore]);
  const { data: earnings, isLoading: isLoadingEarnings } = useDoc<PartnerEarning>(earningsDocRef);

  const clicksQuery = useMemoFirebase(() => {
      if(!firestore || !user?.uid) return null;
      return query(collection(firestore, 'shortlinks'), where('partnerId', '==', user.uid));
  }, [firestore, user]);
  
  const signupsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.tradintaId) return null;
    return query(collection(firestore, 'users'), where('referredBy', '==', userProfile.tradintaId));
  }, [firestore, userProfile]);
  
  const { data: shortlinks, isLoading: isLoadingLinks } = useCollection(clicksQuery);
  const { data: signups, isLoading: isLoadingSignups } = useCollection(signupsQuery);

  const [clickCount, setClickCount] = React.useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = React.useState(true);

  React.useEffect(() => {
    const totalClicks = shortlinks?.reduce((sum, link: any) => sum + (link.clickCount || 0), 0) || 0;
    setClickCount(totalClicks);
    if (!isLoadingLinks) {
        setIsLoadingCounts(false);
    }
  }, [shortlinks, isLoadingLinks]);

  
  const forgingEventsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(collection(firestore, 'forgingEvents'), where('partnerId', '==', user.uid), orderBy('status', 'asc'));
  }, [user, firestore]);
  const { data: forgingEvents, isLoading: isLoadingEvents } = useCollection<ForgingEvent>(forgingEventsQuery);

  const salesQuery = useMemoFirebase(() => {
      if(!user?.uid || !firestore) return null;
      return query(collection(firestore, 'attributedSales'), where('partnerId', '==', user.uid), orderBy('date', 'desc'));
  }, [user, firestore]);
  const { data: sales, isLoading: isLoadingSales } = useCollection<AttributedSale>(salesQuery);
  
  const payoutsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(collection(firestore, 'payouts'), where('partnerId', '==', user.uid), orderBy('date', 'desc'));
  }, [user, firestore]);
  const { data: payouts, isLoading: isLoadingPayouts } = useCollection<Payout>(payoutsQuery);

  // --- Handlers ---
  const handleProposal = (eventId: string, status: 'active' | 'declined') => {
      if(!firestore) return;
      const eventRef = doc(firestore, 'forgingEvents', eventId);
      updateDocumentNonBlocking(eventRef, { status: status, respondedAt: serverTimestamp() });
      toast({
          title: `Proposal ${status === 'active' ? 'Accepted' : 'Declined'}!`,
          description: `The seller has been notified.`
      });
  };

  const referralLink = React.useMemo(() => {
    if (typeof window === 'undefined' || !userProfile?.tradintaId) return '';
    return `${window.location.origin}/signup?ref=${userProfile?.tradintaId}`;
  }, [userProfile]);

  const copyToClipboard = (link: string, type: 'general' | 'campaign', id?: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied to Clipboard!',
      description: 'Your referral link has been copied.',
    });
    if (type === 'general') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    } else {
        setCopiedCampaignLink(id || null);
        setTimeout(() => setCopiedCampaignLink(null), 2000);
    }
  };
  
  const MetricCard = ({ title, value, icon, loading, description }: {title: string, value: string, icon: React.ReactNode, loading: boolean, description?: string}) => (
      <div className="flex items-center gap-4">
        <div className="p-3 bg-muted rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? <Skeleton className="h-6 w-20 mt-1" /> : <p className="text-xl font-bold">{value}</p>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
  );

  const isLoading = isUserLoading || isProfileLoading || isLoadingEarnings;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Your Growth Partner Dashboard</CardTitle>
            <CardDescription>Track your impact, manage campaigns, and view your earnings.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="md:col-span-1 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Referral Funnel</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <MetricCard title="Link Clicks" value={(clickCount || 0).toLocaleString()} icon={<LinkIcon className="text-primary"/>} loading={isLoadingCounts} />
                      <MetricCard title="Sign-ups" value={(signups?.length || 0).toLocaleString()} icon={<Users className="text-primary"/>} loading={isLoadingSignups} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <Input id="referral-link" value={referralLink} readOnly className="text-xs"/>
                    <Button size="icon" onClick={() => copyToClipboard(referralLink, 'general')} aria-label="Copy referral link" disabled={!referralLink}>
                        {copiedLink ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                     <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboards/growth-partner/links">
                            Manage <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild><Link href="/dashboards/growth-partner/profile"><Settings className="h-4 w-4" /></Link></Button>
                </div>
            </Card>
            <Card className="md:col-span-1 p-6 flex flex-col justify-between bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                 <div>
                    <h3 className="font-semibold text-lg mb-4 text-white/90">Earnings Snapshot</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <p className="text-sm text-white/70">Attributed Sales</p>
                           {isLoadingSales ? <Skeleton className="h-7 w-24 bg-white/10" /> : <p className="text-2xl font-bold">KES {(sales?.reduce((sum, s) => sum + s.saleAmount, 0) || 0).toLocaleString()}</p>}
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm text-white/70">Available for Payout</p>
                          {isLoadingEarnings ? <Skeleton className="h-7 w-24 bg-white/10" /> : <p className="text-2xl font-bold text-green-400">KES {(earnings?.unpaidEarnings || 0).toLocaleString()}</p>}
                       </div>
                    </div>
                </div>
                <Button className="w-full mt-4 bg-white text-gray-900 hover:bg-gray-200">
                    <Wallet className="mr-2"/> Request Payout
                </Button>
            </Card>
        </CardContent>
      </Card>

      <Tabs defaultValue="deal-hub" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deal-hub">Deal Hub</TabsTrigger>
          <TabsTrigger value="earnings-history">Payouts and Earnings History</TabsTrigger>
        </TabsList>

        <TabsContent value="deal-hub">
          <Card>
            <CardHeader><CardTitle className='flex items-center gap-2'><Sparkles className="w-5 h-5 text-primary"/>Deal Hub</CardTitle><CardDescription>Review proposals from sellers and manage your active Forging Events.</CardDescription></CardHeader>
            <CardContent>
                {isLoadingEvents ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                : !forgingEvents || forgingEvents.length === 0 ? <p className="text-center text-muted-foreground py-8">No deal proposals yet.</p>
                : <div className="space-y-4">
                    {forgingEvents.map((event) => {
                         const campaignLink = typeof window !== 'undefined' ? `${window.location.origin}/foundry/${event.id}` : '';
                        return(
                            <Card key={event.id} className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-grow space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={event.status === 'active' ? 'default' : 'outline'}>{event.status}</Badge>
                                            <p className="font-semibold text-sm">{event.productName}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            From <Link href={`/manufacturer/${event.sellerId}`} className="hover:underline font-medium text-foreground">{event.sellerName}</Link> | Commission: <span className="font-bold">{event.commissionRate}%</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                         {event.status === 'proposed' && (
                                            <>
                                                <Button size="sm" variant="secondary" onClick={() => handleProposal(event.id, 'active')}><CheckCircle className="mr-2 h-4 w-4"/> Accept</Button>
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleProposal(event.id, 'declined')}><XCircle className="mr-2 h-4 w-4"/> Decline</Button>
                                            </>
                                        )}
                                        {event.status === 'active' && (
                                             <Button size="sm" variant="outline" onClick={() => copyToClipboard(campaignLink, 'campaign', event.id)}>
                                                {copiedCampaignLink === event.id ? <ClipboardCheck className="mr-2 h-4 w-4 text-green-500"/> : <LinkIcon className="mr-2 h-4 w-4" />}
                                                {copiedCampaignLink === event.id ? 'Copied!' : 'Copy Link'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                  </div>
                }
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="earnings-history">
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                <Card className="lg:col-span-1">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TableIcon/> Payout History</CardTitle>
                        <CardDescription>Record of commissions paid out to you.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        {isLoadingPayouts ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        : !payouts || payouts.length === 0 ? <p className="text-center text-sm text-muted-foreground py-12">No payout history yet.</p>
                        : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount (KES)</TableHead>
                                        <TableHead>Transaction ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.map(payout => (
                                        <TableRow key={payout.id}>
                                            <TableCell>{new Date(payout.date?.seconds * 1000).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-semibold text-green-600">KES {payout.amount.toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-xs">{payout.transactionId}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Earnings Ledger</CardTitle>
                        <CardDescription>A detailed history of your commissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingSales ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        : !sales || sales.length === 0 ? <p className="text-center text-muted-foreground py-8">No attributed sales yet.</p>
                        : (
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sale Details</TableHead>
                                        <TableHead className="text-right">Commission</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {sales.map(sale => (
                                        <TableRow key={sale.id}>
                                            <TableCell>
                                                <p className="text-sm font-medium">{sale.productName || `Order ${sale.orderId.substring(0,8)}`}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(sale.date?.seconds * 1000).toLocaleDateString()}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-primary">+KES {sale.commissionEarned.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={sale.payoutStatus === 'Paid' ? 'secondary' : 'default'}>{sale.payoutStatus}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )
                        }
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
