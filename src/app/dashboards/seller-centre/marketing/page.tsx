
'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  BarChart,
  DollarSign,
  Wallet,
  Megaphone,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { logFeatureUsage } from '@/lib/analytics';
import Link from 'next/link';
import { collection, doc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { SellerService } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { removeEntityFromAdSlot } from '@/app/lib/actions/marketing';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

type AdSlot = {
  id: string;
  name: string;
  expiresAt?: any;
  pinnedEntities: { id: string; name: string; imageUrl?: string; entityType: 'product' | 'manufacturer' }[];
};

type Campaign = {
  id: string;
  name: string;
  status: 'Active' | 'Draft' | 'Expired';
  spend: number;
  clicks: number;
  conversions: number;
};

type MarketingPlan = {
    price: number;
}

const StatCard = ({ title, value, isLoading, icon, description }: { title: string, value: string | number, isLoading: boolean, icon: React.ReactNode, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);


const ActivePlacements = ({ adSlots, onTakeDown, isProcessing }: { adSlots: AdSlot[], onTakeDown: (slotId: string, entityId: string) => void, isProcessing: boolean }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Placement Location</TableHead>
                    <TableHead>Featured Item</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {adSlots.length > 0 ? adSlots.flatMap(slot => 
                    slot.pinnedEntities.map(entity => (
                        <TableRow key={`${slot.id}-${entity.id}`}>
                            <TableCell>{slot.name}</TableCell>
                            <TableCell className="flex items-center gap-2">
                                {entity.imageUrl && <Image src={entity.imageUrl} alt={entity.name} width={32} height={32} className="rounded-md" />}
                                <span className="font-medium">{entity.name}</span>
                            </TableCell>
                            <TableCell>12,345</TableCell>
                            <TableCell>678</TableCell>
                            <TableCell>{slot.expiresAt ? new Date(slot.expiresAt.seconds * 1000).toLocaleDateString() : 'Ongoing'}</TableCell>
                            <TableCell>
                                <Button variant="destructive" size="sm" onClick={() => onTakeDown(slot.id, entity.id)} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Take Down
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">No active placements found. Your plan may be processing.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default function SellerMarketingPage() {
  const { user, role } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [adSlots, setAdSlots] = React.useState<AdSlot[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // --- Start: New Data Fetching Logic ---
  const manufacturerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'manufacturers', user.uid);
  }, [user, firestore]);
  const { data: manufacturerData, isLoading: isLoadingManufacturer } = useDoc(manufacturerDocRef);
  
  const planDocRef = useMemoFirebase(() => {
      if (!firestore || !manufacturerData?.marketingPlanId) return null;
      return doc(firestore, 'marketingPlans', manufacturerData.marketingPlanId);
  }, [firestore, manufacturerData]);
  const { data: plan, isLoading: isLoadingPlan } = useDoc<MarketingPlan>(planDocRef);

  const clicksQuery = useMemoFirebase(() => {
    if(!firestore || !user?.tradintaId) return null;
    return query(collection(firestore, 'linkClicks'), where('referrerId', '==', user.tradintaId));
  }, [firestore, user]);
  const { data: clicks, isLoading: isLoadingClicks } = useCollection(clicksQuery);

  const conversionsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'attributedSales'), where('partnerId', '==', user.uid));
  }, [firestore, user]);
  const { data: conversions, isLoading: isLoadingConversions } = useCollection(conversionsQuery);

  const isLoadingStats = isLoadingManufacturer || isLoadingPlan || isLoadingClicks || isLoadingConversions;
  // --- End: New Data Fetching Logic ---

  const fetchAdPlacements = React.useCallback(async () => {
      if (!user || !firestore) return;
      setIsLoading(true);
      try {
        const allSlots = await SellerService.getAdSlots();
        
        const sellerProductsSnapshot = await getDocs(collection(firestore, 'manufacturers', user.uid, 'products'));
        const sellerProductIds = new Set(sellerProductsSnapshot.docs.map(doc => doc.id));
        
        const mySlots = allSlots
          .map(slot => {
            const myEntities = slot.pinnedEntities?.filter((entity: any) => 
              (entity.entityType === 'manufacturer' && entity.id === user.uid) ||
              (entity.entityType === 'product' && sellerProductIds.has(entity.id))
            );
            return myEntities?.length > 0 ? { ...slot, pinnedEntities: myEntities } : null;
          })
          .filter((slot): slot is AdSlot => slot !== null);
          
        setAdSlots(mySlots);
      } catch (error: any) {
          toast({ title: "Error", description: "Could not fetch marketing placements.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
  }, [user, firestore, toast]);

  React.useEffect(() => {
    fetchAdPlacements();
  }, [fetchAdPlacements]);

  const handleTakeDown = async (slotId: string, entityId: string) => {
      setIsProcessing(true);
      const result = await removeEntityFromAdSlot(slotId, entityId);
      if (result.success) {
          toast({ title: 'Placement Removed', description: 'The item will be removed from this slot shortly.' });
          fetchAdPlacements(); // Refresh the list
      } else {
          toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setIsProcessing(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Marketing Centre</CardTitle>
          <CardDescription>
            Boost your products, run ad campaigns, and track your performance.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ad Spend (30d)" value={`KES ${plan?.price?.toLocaleString() || '0'}`} isLoading={isLoadingStats} icon={<DollarSign />} />
        <StatCard title="Clicks" value={clicks?.length || 0} isLoading={isLoadingStats} icon={<Eye />} />
        <StatCard title="Conversions" value={`+${conversions?.length || 0}`} isLoading={isLoadingStats} icon={<Wallet />} />

        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-primary/10 border-primary/20 text-center flex flex-col justify-center">
            <CardContent className="p-6">
                <Megaphone className="h-8 w-8 mx-auto text-primary mb-2" />
                <h3 className="text-lg font-semibold">Upgrade Your Plan</h3>
                <p className="text-sm text-muted-foreground mb-4">Unlock more placements and premium features.</p>
                <Button asChild><Link href="/marketing-plans">View Marketing Plans</Link></Button>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="placements">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="placements">Active Placements</TabsTrigger>
          <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="placements">
             <Card>
                <CardHeader>
                    <CardTitle>Active Promotional Placements</CardTitle>
                    <CardDescription>All the places your products and shop are currently being featured across Tradinta.</CardDescription>
                </CardHeader>
                <CardContent>
                   {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : <ActivePlacements adSlots={adSlots} onTakeDown={handleTakeDown} isProcessing={isProcessing} />}
                </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Manual Campaigns</CardTitle>
                <Button disabled><PlusCircle className="mr-2 h-4 w-4" />New Campaign</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Status</TableHead><TableHead>Spend (KES)</TableHead><TableHead>Clicks</TableHead><TableHead>Conversions</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Manual campaign creation coming soon.</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
