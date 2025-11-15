
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  FileText,
  Star,
  DollarSign,
  ArrowRight,
  Lock,
  Banknote,
  MessageSquare,
  Info,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Wallet,
  BookCopy,
  Factory,
  Send,
  Megaphone,
  Sparkles,
  Users,
  Percent,
  Copy,
  Gift,
  Coins,
  User,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useDoc,
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Review } from '@/app/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logFeatureUsage } from '@/lib/analytics';
import { ReportModal } from '@/components/report-modal';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { ApplyToBecomeManufacturer } from '@/components/apply-to-become-manufacturer';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';

type VerificationStatus =
  | 'Unsubmitted'
  | 'Pending Legal'
  | 'Pending Admin'
  | 'Action Required'
  | 'Verified';
  
type ManufacturerData = {
  shopName?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessLicenseNumber?: string;
  kraPin?: string;
  address?: string;
  phone?: string;
  email?: string;
  paymentPolicy?: string;
  shippingPolicy?: string;
  returnPolicy?: string;
  verificationStatus?: VerificationStatus;
  suspensionDetails?: {
    isSuspended: boolean;
    reason: string;
    prohibitions: string[];
    publicDisclaimer: boolean;
  };
};

type Product = {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  price: number; // Assuming a base price exists on the product
};

type PointsLedgerEvent = {
    event_id: string;
    points: number;
};

const quickActions = [
  { title: "My Orders & RFQs", icon: <Image src="https://i.postimg.cc/nLNc3bZW/quotations-Photoroom.png" alt="Orders & RFQs Icon" width={96} height={96} />, href: "/dashboards/buyer/orders" },
  { title: "Messages", icon: <MessageSquare className="w-12 h-12 text-primary" />, href: "/dashboards/buyer/messages" },
  { title: "TradPoints", icon: <Image src="https://i.postimg.cc/ncP9DZG2/image-Photoroom-2.png" alt="TradPoints Icon" width={96} height={96} />, href: "/dashboards/buyer/tradpoints" },
  { title: "The Foundry", icon: <Image src="https://i.postimg.cc/VkfCYdsM/image.png" alt="The Foundry Icon" width={96} height={96} />, href: "/foundry" },
];

type UserProfile = {
    tradintaId?: string;
    email: string;
    fullName: string;
};

type Pledge = {
    id: string;
    forgingEventId: string;
}

type ForgingEvent = {
    id: string;
    productId: string;
    productName: string;
    productImageUrl: string;
    sellerName: string;
    sellerId: string;
    status: 'active' | 'finished';
    endTime: any;
    tiers: { buyerCount: number; discountPercentage: number }[];
    currentBuyerCount: number;
    finalDiscountTier?: number;
};


const ProfileCard = () => {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [copied, setCopied] = React.useState(false);

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    React.useEffect(() => {
        // If user data is loaded and there is no tradintaId, generate one.
        if (userDocRef && userProfile && !userProfile.tradintaId) {
            const newId = nanoid(8);
            updateDocumentNonBlocking(userDocRef, { tradintaId: newId });
            toast({
                title: "Tradinta ID Generated",
                description: "Your unique ID has been created.",
            });
        }
    }, [userProfile, userDocRef, toast]);


    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: 'Copied to clipboard!' });
        setTimeout(() => setCopied(false), 2000);
    };

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                </CardContent>
            </Card>
        );
    }

    if (!userProfile) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2"><User className="w-6 h-6" /> My Profile</CardTitle>
                    <CardDescription>Your personal information on Tradinta.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/dashboards/buyer/settings">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Account Settings</span>
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{userProfile.fullName}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-semibold">{userProfile.email}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">Tradinta ID</p>
                     {userProfile.tradintaId ? (
                        <div className="flex items-center gap-2">
                            <p className="font-semibold font-mono">{userProfile.tradintaId}</p>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(userProfile.tradintaId!)}>
                                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    ) : (
                        <Skeleton className="h-5 w-24" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const MyPledges = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const pledgesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'pledges'), where('buyerId', '==', user.uid));
    }, [user, firestore]);

    const { data: pledges, isLoading: isLoadingPledges } = useCollection<Pledge>(pledgesQuery);
    
    const [events, setEvents] = React.useState<Record<string, ForgingEvent>>({});
    const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);
    const [isCompletingPurchase, setIsCompletingPurchase] = React.useState<string | null>(null);


    React.useEffect(() => {
        if (pledges && pledges.length > 0 && firestore) {
            setIsLoadingEvents(true);
            const eventIds = [...new Set(pledges.map(p => p.forgingEventId))];
            
            const fetchEvents = async () => {
                const eventPromises = eventIds.map(id => getDoc(doc(firestore, 'forgingEvents', id)));
                const eventSnaps = await Promise.all(eventPromises);
                const fetchedEvents: Record<string, ForgingEvent> = {};
                eventSnaps.forEach(snap => {
                    if (snap.exists()) {
                        fetchedEvents[snap.id] = snap.data() as ForgingEvent;
                    }
                });
                setEvents(fetchedEvents);
                setIsLoadingEvents(false);
            };
            fetchEvents();
        }
    }, [pledges, firestore]);
    
    const handleCompletePurchase = async (event: ForgingEvent) => {
        if (!user || !firestore) return;
        setIsCompletingPurchase(event.id);
        
        try {
            // Get original product price
            const productRef = doc(firestore, 'manufacturers', event.sellerId, 'products', event.productId);
            const productSnap = await getDoc(productRef);
            if (!productSnap.exists()) throw new Error("Original product not found.");
            
            const productData = productSnap.data() as Product;
            const basePrice = productData.price || 0;
            const discount = (event.finalDiscountTier || 0) / 100;
            const finalPrice = basePrice * (1 - discount);
            const orderId = nanoid();

            const orderData = {
                id: orderId,
                buyerId: user.uid,
                buyerName: user.displayName,
                sellerId: event.sellerId,
                sellerName: event.sellerName,
                totalAmount: finalPrice,
                orderDate: serverTimestamp(),
                status: 'Pending Payment',
                relatedForgingEventId: event.id,
                 items: [{
                    productId: event.productId,
                    productName: event.productName,
                    quantity: 1, // Assuming quantity of 1 for now
                    unitPrice: finalPrice,
                    imageUrl: event.productImageUrl,
                }],
            };
            
            await setDoc(doc(firestore, 'orders', orderId), orderData);
            
            toast({
                title: 'Order Created!',
                description: 'Your discounted order has been created. Proceed to payment.'
            });

            router.push(`/checkout/${orderId}`);

        } catch (error: any) {
            toast({ title: 'Error Creating Order', description: error.message, variant: 'destructive' });
            setIsCompletingPurchase(null);
        }
    };


    const isLoading = isLoadingPledges || isLoadingEvents;
    
    const PledgeItem = ({ pledge }: { pledge: Pledge }) => {
        const event = events[pledge.forgingEventId];
        if (!event) return <Skeleton className="h-24 w-full" />;

        if (event.status === 'active') {
            const { nextTier, progress } = React.useMemo(() => {
                const sortedTiers = [...event.tiers].sort((a, b) => a.buyerCount - b.buyerCount);
                const nextTier = sortedTiers.find(t => t.buyerCount > event.currentBuyerCount);
                const progress = nextTier ? (event.currentBuyerCount / nextTier.buyerCount) * 100 : 100;
                return { nextTier, progress };
            }, [event.tiers, event.currentBuyerCount]);

            return (
                <div className="border p-3 rounded-md space-y-2">
                    <div className="flex gap-3">
                         <Image src={event.productImageUrl || ''} width={64} height={64} alt={event.productName} className="rounded-md aspect-square object-cover" />
                        <div>
                            <p className="font-semibold text-sm">{event.productName}</p>
                            <p className="text-xs text-muted-foreground">by {event.sellerName}</p>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                        {nextTier ? `${nextTier.buyerCount - event.currentBuyerCount} more pledges to unlock ${nextTier.discountPercentage}% OFF!` : "Highest discount unlocked!"}
                    </p>
                </div>
            );
        }
        
        if (event.status === 'finished') {
             return (
                <div className="border p-3 rounded-md space-y-2 bg-green-50 dark:bg-green-900/20">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                         <Image src={event.productImageUrl || ''} width={64} height={64} alt={event.productName} className="rounded-md aspect-square object-cover" />
                        <div className="flex-grow text-center sm:text-left">
                            <p className="font-semibold text-sm">{event.productName}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <Badge className="bg-green-100 text-green-800 text-lg"><Percent className="w-4 h-4 mr-1"/>{event.finalDiscountTier}% OFF</Badge>
                                <p className="text-xs text-muted-foreground">Deal Ended!</p>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => handleCompletePurchase(event)} disabled={isCompletingPurchase === event.id}>
                           {isCompletingPurchase === event.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                           Complete Purchase
                        </Button>
                    </div>
                </div>
             );
        }
        
        return null;
    }

    return (
        <Card>
            <CardHeader className="text-center items-center">
                 <Image src="https://i.postimg.cc/VkfCYdsM/image.png" alt="The Foundry Logo" width={64} height={64} className="mx-auto" />
                <CardTitle>My Pledges</CardTitle>
                <CardDescription>Track your active and completed Forging Events.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                     </div>
                ) : !pledges || pledges.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        You have not pledged to any Forging Events yet.
                        <Button variant="link" asChild><Link href="/foundry">Explore active deals</Link></Button>
                    </p>
                ) : (
                    <div className="space-y-3">
                        {pledges.map(pledge => <PledgeItem key={pledge.id} pledge={pledge} />)}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function BuyerDashboardContent() {
    const { user, role } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [copied, setCopied] = React.useState(false);
    
    React.useEffect(() => {
        if (user && role) {
          logFeatureUsage({ feature: 'page:view', userId: user.uid, userRole: role, metadata: { page: '/dashboards/buyer' } });
        }
    }, [user, role]);

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const ledgerQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'pointsLedgerEvents'), where('user_id', '==', user.uid));
    }, [user, firestore]);
    const { data: ledgerEvents, isLoading: isLoadingLedger } = useCollection<PointsLedgerEvent>(ledgerQuery);

    const totalPoints = React.useMemo(() => {
        if (!ledgerEvents) return 0;
        return ledgerEvents.reduce((sum, event) => sum + event.points, 0);
    }, [ledgerEvents]);

    const referralLink = React.useMemo(() => {
        if (typeof window === 'undefined' || !userProfile?.tradintaId) return '';
        return `${window.location.origin}/signup?ref=${userProfile.tradintaId}`;
    }, [userProfile]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast({ title: 'Copied to clipboard!' });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Tradinta Dashboard</CardTitle>
                    <CardDescription>Your central hub for trading, rewards, and insights.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Center Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-primary"/>My Wallet</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">TradePay Balance</p>
                                <p className="text-2xl font-bold">KES 0.00</p>
                                <p className="text-xs text-muted-foreground">Coming Soon</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">TradPoints Balance</p>
                                {isLoadingLedger ? <Skeleton className="h-8 w-24 mt-1" /> : (
                                    <p className="text-2xl font-bold">{totalPoints.toLocaleString()} Points</p>
                                )}
                                <Progress value={totalPoints % 1000 / 10} className="mt-2 h-2" />
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">$TRAD Balance</p>
                                <p className="text-2xl font-bold">Coming Soon</p>
                                <p className="text-xs text-muted-foreground">TradPoints will be convertible to $TRAD</p>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Quick Actions Panel */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickActions.map((action) => (
                            <Link href={action.href} key={action.title}>
                                <Card className="text-center hover:bg-accent hover:shadow-md transition-all h-full flex flex-col justify-center items-center p-4">
                                    <div className="mb-2 h-12 w-12 flex items-center justify-center">{action.icon}</div>
                                    <p className="font-semibold text-sm">{action.title}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    <MyPledges />

                </div>
                 {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                    <ProfileCard />

                     {/* TradPoints Engagement Panel */}
                    <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Gift className="w-6 h-6"/> Earn More TradPoints!</CardTitle>
                            <CardDescription>Complete tasks and refer others to earn rewards that will convert to $TRAD tokens.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-background/50 rounded-lg p-4 mb-4">
                                <label htmlFor="referral-link" className="text-sm font-medium">Your Unique Referral Link</label>
                                {isProfileLoading ? <Skeleton className="h-9 w-full mt-1"/> : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input id="referral-link" type="text" value={referralLink} readOnly className="flex-grow bg-muted border border-border rounded-md px-3 py-1.5 text-sm" />
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleCopy} disabled={!referralLink}>
                                            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">Share your link via WhatsApp, Email, or Social Media to earn 50 points for every verified signup!</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild>
                               <Link href="/dashboards/buyer/tradpoints">View All Tasks &amp; Rewards <ArrowRight className="ml-2 w-4 h-4" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function BuyerDashboardPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <BuyerDashboardContent />
        </React.Suspense>
    )
}
