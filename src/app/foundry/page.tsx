
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Users, Clock, Percent, ArrowRight, Hammer, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase';

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

const CountdownTimer = ({ endTime }: { endTime: any }) => {
  const calculateTimeLeft = React.useCallback(() => {
    const difference = +new Date(endTime.toDate()) - +new Date();
    let timeLeft: Record<string, number> = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      };
    }
    return timeLeft;
  }, [endTime]);

  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearTimeout(timer);
  });
  
  if (!timeLeft.days && !timeLeft.hours && !timeLeft.minutes) {
      return <span className="font-semibold text-destructive">Ending soon!</span>
  }

  return (
    <div className="flex items-center gap-1 text-sm font-semibold">
      <Clock className="w-4 h-4" />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours > 0 && `${timeLeft.hours}h `}
        {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
        left
      </span>
    </div>
  );
};

export const FoundryCard = ({ event }: { event: ForgingEvent }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPledging, setIsPledging] = React.useState(false);
    const [hasPledged, setHasPledged] = React.useState(false);

    React.useEffect(() => {
        if (user && firestore) {
            const checkPledge = async () => {
                const pledgeQuery = query(collection(firestore, 'pledges'), where('buyerId', '==', user.uid), where('forgingEventId', '==', event.id), limit(1));
                const snapshot = await getDocs(pledgeQuery);
                setHasPledged(!snapshot.empty);
            }
            checkPledge();
        }
    }, [user, firestore, event.id]);


    const { currentDiscount, nextTier, progress } = React.useMemo(() => {
        const sortedTiers = [...event.tiers].sort((a, b) => a.buyerCount - b.buyerCount);
        let currentDiscount = 0;
        
        for (const tier of sortedTiers) {
            if (event.currentBuyerCount >= tier.buyerCount) {
                currentDiscount = tier.discountPercentage;
            }
        }
        
        const nextTier = sortedTiers.find(t => t.buyerCount > event.currentBuyerCount);
        const progress = nextTier ? (event.currentBuyerCount / nextTier.buyerCount) * 100 : 100;

        return { currentDiscount, nextTier, progress };
    }, [event.tiers, event.currentBuyerCount]);

     const handlePledge = async () => {
        if (!user || !firestore) {
            toast({ title: 'Please log in to pledge.', variant: 'destructive'});
            return;
        }
        setIsPledging(true);
        try {
            await addDocumentNonBlocking(collection(firestore, 'pledges'), {
                id: nanoid(),
                forgingEventId: event.id,
                buyerId: user.uid,
                pledgedAt: serverTimestamp(),
            });
            toast({ title: "You've Pledged!", description: "You will be notified when the event ends."});
            setHasPledged(true); // UI update
            // Note: A Cloud Function should listen for new pledges to update the event's buyer count
            // to avoid client-side race conditions and ensure data integrity.
        } catch (error: any) {
             toast({ title: 'Pledge failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsPledging(false);
        }
    };


    return (
        <Card className="overflow-hidden group flex flex-col">
            <Link href={`/products/${event.sellerId}/${event.id}`} className='flex-grow'> {/* Needs correct slug */}
                 <div className="relative aspect-video">
                    <Image src={event.productImageUrl || 'https://i.postimg.cc/j283ydft/image.png'} alt={event.productName} fill className="object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                     <div className="absolute top-2 right-2 bg-background/80 text-foreground px-2 py-1 rounded-full text-xs">
                        <CountdownTimer endTime={event.endTime} />
                    </div>
                     <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="font-bold text-lg">{event.productName}</h3>
                        <p className="text-sm">from {event.sellerName}</p>
                    </div>
                </div>
            </Link>
            <CardContent className="p-4 space-y-3">
                 <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{event.currentBuyerCount} Buyers Pledged</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-lg text-primary">{currentDiscount}% OFF</span>
                    </div>
                </div>
                <div>
                    <Progress value={progress} className="h-2" />
                    {nextTier ? (
                         <p className="text-xs text-muted-foreground mt-1.5 text-center">
                            {nextTier.buyerCount - event.currentBuyerCount} more pledges to unlock <span className="font-bold">{nextTier.discountPercentage}% OFF!</span>
                        </p>
                    ) : (
                         <p className="text-xs text-green-600 font-semibold mt-1.5 text-center">Highest discount tier unlocked!</p>
                    )}
                </div>
                
                 <div className="flex items-center justify-between pt-2">
                     <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={event.partnerAvatarUrl} />
                            <AvatarFallback>{event.partnerName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs text-muted-foreground">Promoted by</p>
                            <p className="text-sm font-semibold">{event.partnerName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button size="sm" variant="outline" onClick={handlePledge} disabled={isPledging || hasPledged}>
                            {isPledging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {hasPledged ? "You've Pledged!" : "Pledge"}
                         </Button>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <Button size="sm" variant="secondary" disabled>
                                        <Hammer className="w-4 h-4 mr-2" /> Forge Now
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Forge (purchase) becomes available when the deal ends.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function FoundryPage() {
  const firestore = useFirestore();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'forgingEvents'),
      where('status', '==', 'active'),
      orderBy('endTime', 'asc')
    );
  }, [firestore]);

  const { data: events, isLoading } = useCollection<ForgingEvent>(eventsQuery);

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <Image src="https://i.postimg.cc/VkfCYdsM/image.png" alt="The Foundry Logo" width={64} height={64} className="mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4 mb-4">
          The Foundry
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Join forces with other buyers to forge incredible deals directly from
          manufacturers. The more people who pledge, the bigger the discount for everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
             Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-[420px] w-full" />)
        ) : events && events.length > 0 ? (
            events.map(event => <FoundryCard key={event.id} event={event} />)
        ) : (
            <div className="col-span-full text-center py-24 bg-muted/50 rounded-lg">
                <h3 className="text-xl font-semibold">No Active Deals</h3>
                <p className="text-muted-foreground mt-2">
                    There are no active Forging Events right now. Check back soon!
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
