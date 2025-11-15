
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import {
  Star,
  Users,
  BarChart,
  UserPlus,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, getDoc, collection, getCountFromServer, query, where, limit, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowButton } from '@/components/follow-button';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { useToast } from '@/hooks/use-toast';
import { FoundryCard } from '@/app/foundry/page'; // Re-using this component for deals

type UserProfile = {
  id: string;
  fullName: string;
  bio?: string;
  photoURL?: string;
  role: string;
  tradintaId?: string;
};

type ForgingEvent = {
  id: string;
  name: string;
  productName: string;
  productImageUrl: string;
  sellerName: string;
  sellerId: string;
  partnerName: string;
  partnerId: string;
  partnerAvatarUrl?: string;
  status: 'active' | 'finished';
  endTime: any; // Firestore Timestamp
  tiers: { buyerCount: number; discountPercentage: number }[];
  currentBuyerCount: number;
};

export default function PartnerProfilePage() {
  const params = useParams();
  const partnerTradintaId = params.id as string;
  const firestore = useFirestore();
  const { user, role } = useUser();
  const { toast } = useToast();

  const [partner, setPartner] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [followerCount, setFollowerCount] = React.useState(0);
  const [isLoadingFollowers, setIsLoadingFollowers] = React.useState(true);
  const [partnerDeals, setPartnerDeals] = React.useState<ForgingEvent[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = React.useState(true);

  const [myNetwork, setMyNetwork] = useLocalStorageState<Omit<UserProfile, 'role'>[]>('my-partner-network', []);
  const isInNetwork = myNetwork.some(p => p.tradintaId === partnerTradintaId);

  React.useEffect(() => {
    if (!firestore || !partnerTradintaId) return;

    const fetchPartner = async () => {
      setIsLoading(true);
      const partnerQuery = query(collection(firestore, 'users'), where('tradintaId', '==', partnerTradintaId), limit(1));
      const querySnapshot = await getDocs(partnerQuery);

      if (querySnapshot.empty) {
        setPartner(null);
        setIsLoading(false);
        return;
      }

      const partnerDoc = querySnapshot.docs[0];
      const partnerData = { id: partnerDoc.id, ...partnerDoc.data() } as UserProfile;

      if (partnerData.role !== 'partner') {
        setPartner(null);
        setIsLoading(false);
        return;
      }
      
      setPartner(partnerData);
      
      // Fetch follower count
      setIsLoadingFollowers(true);
      const followersCol = collection(firestore, `partners/${partnerData.id}/followers`);
      const snapshot = await getCountFromServer(followersCol);
      setFollowerCount(snapshot.data().count);
      setIsLoadingFollowers(false);

      // Fetch partner's deals
      setIsLoadingDeals(true);
      const dealsQuery = query(collection(firestore, 'forgingEvents'), where('partnerId', '==', partnerData.id), where('status', '==', 'active'));
      const dealsSnapshot = await getDocs(dealsQuery);
      setPartnerDeals(dealsSnapshot.docs.map(d => d.data() as ForgingEvent));
      setIsLoadingDeals(false);

      setIsLoading(false);
    };

    fetchPartner();
  }, [firestore, partnerTradintaId]);

  const handleToggleNetwork = () => {
    if (!partner) return;
    if (isInNetwork) {
      setMyNetwork(myNetwork.filter(p => p.tradintaId !== partnerTradintaId));
      toast({ title: 'Partner Removed', description: `${partner.fullName} has been removed from your network.` });
    } else {
      setMyNetwork([...myNetwork, { id: partner.id, tradintaId: partner.tradintaId, fullName: partner.fullName, photoURL: partner.photoURL, bio: partner.bio }]);
      toast({ title: 'Partner Added!', description: `${partner.fullName} has been added to your network.` });
    }
  }


  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-6 w-1/3 mb-12" />
            <div className="grid md:grid-cols-3 items-center gap-8 mb-12">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                </div>
                <div className="flex justify-center md:justify-end">
                    <Skeleton className="h-32 w-32 rounded-full" />
                </div>
            </div>
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

  if (!partner) {
    return notFound();
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/partners">Partners</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{partner.fullName}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <header className="grid md:grid-cols-3 gap-8 items-center mb-12">
          <div className="md:col-span-2">
            <h1 className="text-4xl lg:text-5xl font-bold font-headline mb-3">{partner.fullName}</h1>
            <p className="text-lg text-muted-foreground mb-4">Tradinta Growth Partner</p>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" /> 
                    {isLoadingFollowers ? <Skeleton className="h-4 w-12" /> : <span>{followerCount.toLocaleString()} Followers</span>}
                </div>
                <FollowButton targetId={partner.id} targetType="partner" />
                {role === 'manufacturer' && (
                    <Button variant={isInNetwork ? 'secondary' : 'default'} onClick={handleToggleNetwork}>
                        {isInNetwork ? <Check className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {isInNetwork ? 'In My Network' : 'Add to My Network'}
                    </Button>
                )}
            </div>
          </div>
          <div className="flex justify-start md:justify-end">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={partner.photoURL || `https://i.pravatar.cc/150?u=${partner.id}`} />
                <AvatarFallback>{partner.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>About {partner.fullName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{partner.bio || "This partner has not added a bio yet."}</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold font-headline mb-6">Promoted Deals</h2>
           {isLoadingDeals ? <div className="grid md:grid-cols-3 gap-6"><Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" /></div>
           : partnerDeals.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {partnerDeals.map(deal => (
                        <FoundryCard key={deal.id} event={deal} />
                    ))}
                </div>
           ) : (
                <div className="text-center py-16 bg-muted/50 rounded-lg">
                    <h3 className="text-lg font-semibold">No Active Campaigns</h3>
                    <p className="text-muted-foreground mt-2">
                        This partner is not currently promoting any campaigns.
                    </p>
                </div>
           )}
        </section>
      </div>
    </div>
  );
}
