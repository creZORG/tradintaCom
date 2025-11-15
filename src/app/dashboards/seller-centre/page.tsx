
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
  BarChart,
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
} from '@/firebase';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Review } from '@/app/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logFeatureUsage } from '@/lib/analytics';
import { ReportModal } from '@/components/report-modal';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  contactEmail?: string;
};

type Product = {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
};

type OrderData = {
    id: string;
    buyerName?: string;
    totalAmount: number;
    status: string;
    orderDate: any;
    isTradintaDirect?: boolean;
    items?: { productName: string }[];
    productName?: string;
};

type QuotationData = {
    id: string;
    status: string;
    buyerName: string;
    productName: string;
    createdAt: any;
};


const VerificationStatusCard = ({
  manufacturerId,
}: {
  manufacturerId: string;
}) => {
  const firestore = useFirestore();
  const manufacturerDocRef = useMemoFirebase(() => {
    if (!firestore || !manufacturerId) return null;
    return doc(firestore, 'manufacturers', manufacturerId);
  }, [firestore, manufacturerId]);

  const { data: manufacturer, isLoading } = useDoc<{
    verificationStatus?: VerificationStatus;
  }>(manufacturerDocRef);

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  const status = manufacturer?.verificationStatus || 'Unsubmitted';
  const currentStatusInfo = statusInfo[status];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Status</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        {currentStatusInfo.icon}
        <div>
          <Badge variant={currentStatusInfo.badgeVariant} className="mb-2">
            {currentStatusInfo.title}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {currentStatusInfo.description}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/dashboards/seller-centre/verification">
            {status === 'Verified'
              ? 'View Verification Documents'
              : 'Submit Verification Documents'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};


const calculateProfileCompleteness = (manufacturer: ManufacturerData | null) => {
    if (!manufacturer) return 0;
    const fields = [
        'shopName', 'tagline', 'description', 'logoUrl',
        'address', 'phone', 
        'paymentPolicy', 'shippingPolicy', 'returnPolicy'
    ];
    const totalFields = fields.length;
    let completedFields = 0;
    
    fields.forEach(field => {
        if (manufacturer[field as keyof ManufacturerData]) {
            completedFields++;
        }
    });

    return Math.round((completedFields / totalFields) * 100);
}

const statusInfo: Record<
  VerificationStatus,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    badgeVariant: 'secondary' | 'default' | 'destructive' | 'outline';
  }
> = {
  Unsubmitted: {
    icon: <Info className="h-8 w-8 text-muted-foreground" />,
    title: 'Documents Required',
    description:
      'Submit your business documents to get a "Verified" badge and build trust with buyers.',
    badgeVariant: 'outline',
  },
  'Pending Legal': {
    icon: <Clock className="h-8 w-8 text-yellow-500" />,
    title: 'Pending Legal & Compliance Review',
    description:
      'Your business documents are being reviewed. This usually takes 2-3 business days.',
    badgeVariant: 'default',
  },
  'Pending Admin': {
    icon: <Clock className="h-8 w-8 text-blue-500" />,
    title: 'Pending Final Approval',
    description:
      'Your documents are approved. Final review of your shop profile is in progress.',
    badgeVariant: 'default',
  },
  'Action Required': {
    icon: <AlertTriangle className="h-8 w-8 text-destructive" />,
    title: 'Action Required',
    description:
      'There was an issue with your submission. Please check your email for details and resubmit.',
    badgeVariant: 'destructive',
  },
  Verified: {
    icon: <ShieldCheck className="h-8 w-8 text-green-500" />,
    title: 'Shop Verified',
    description:
      'Congratulations! Your shop is live and visible to all buyers on Tradinta.',
    badgeVariant: 'secondary',
  },
};

export default function SellerDashboardPage() {
  const { user, role } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  React.useEffect(() => {
    if (user && role) {
      logFeatureUsage({ feature: 'page:view', userId: user.uid, userRole: role, metadata: { page: '/dashboards/seller-centre' } });
    }
  }, [user, role]);

  const manufacturerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'manufacturers', user.uid);
  }, [user, firestore]);
  
  const { data: manufacturer, isLoading: isLoadingManufacturer } = useDoc<ManufacturerData>(manufacturerDocRef);
  const profileCompleteness = calculateProfileCompleteness(manufacturer);

  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, 'orders'), 
        where('sellerId', '==', user.uid), 
        where('isTradintaDirect', '!=', true),
        orderBy('isTradintaDirect', 'asc'), 
        orderBy('orderDate', 'desc'), 
        limit(3)
    );
  }, [user, firestore]);

  const { data: ordersData, isLoading: isLoadingOrders } = useCollection<OrderData>(ordersQuery);

  const quotationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'manufacturers', user.uid, 'quotations'), orderBy('createdAt', 'desc'), limit(3));
  }, [user, firestore]);
  const { data: quotationsData, isLoading: isLoadingQuotes } = useCollection<QuotationData>(quotationsQuery);

  const { totalRevenue, activeOrders, pendingQuotes } = React.useMemo(() => {
    const revenue = ordersData
        ?.filter(o => ['Shipped', 'Delivered'].includes(o.status))
        .reduce((sum, order) => sum + order.totalAmount, 0) || 0;
    
    const active = ordersData
        ?.filter(o => ['Processing', 'Pending Fulfillment', 'Shipped'].includes(o.status))
        .length || 0;
        
    const pending = quotationsData
        ?.filter(q => q.status === 'New')
        .length || 0;

    return { totalRevenue: revenue, activeOrders: active, pendingQuotes: pending };
  }, [ordersData, quotationsData]);

  const isLoadingMetrics = isLoadingOrders || isLoadingQuotes;

  const quickActions = [
    { title: "B2B Products", description: "Manage your product catalog", icon: <Package />, href: "/dashboards/seller-centre/products" },
    { title: "B2B Orders", description: "Fulfill your direct orders", icon: <ShoppingCart />, href: "/dashboards/seller-centre/orders" },
    { title: "Quotations (RFQs)", description: "Respond to buyer inquiries", icon: <FileText />, href: "/dashboards/seller-centre/quotations" },
    { title: "Marketing", description: "Boost your shop & products", icon: <Megaphone />, href: "/dashboards/seller-centre/marketing" },
    { title: "Analytics", description: "Track your shop's performance", icon: <BarChart />, href: "/dashboards/seller-centre/analytics" },
  ];
  
  const handleFeatureClick = (feature: string, metadata?: Record<string, any>) => {
    if (user && role) {
      logFeatureUsage({ feature, userId: user.uid, userRole: role, metadata: { page: '/dashboards/seller-centre', ...metadata } });
    }
  };

  const shopName = manufacturer?.shopName;
  const isSuspended = manufacturer?.suspensionDetails?.isSuspended === true;
  const hasNoEmail = !manufacturer?.contactEmail;


  return (
    <div className="space-y-6">
      {isSuspended && (
          <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Shop Suspended</AlertTitle>
          <AlertDescription>
              Your shop has active restrictions. Please contact support for more information.
          </AlertDescription>
          </Alert>
      )}
      {hasNoEmail && !isSuspended && (
          <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contact Email Missing</AlertTitle>
          <AlertDescription>
              You will not receive email notifications for new messages from buyers. Please <Link href="/dashboards/seller-centre/profile" className="font-semibold underline">update your profile</Link> to add a contact email.
          </AlertDescription>
          </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            {isLoadingManufacturer ? <Skeleton className="h-8 w-2/3" /> : (
                                <CardTitle className="text-3xl font-bold font-headline">Welcome back, {shopName ? shopName : "Seller"}!</CardTitle>
                            )}
                            <CardDescription>Your central hub for managing your shop, products, and orders.</CardDescription>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/dashboards/seller-centre/messages">
                                <MessageSquare className="mr-2 h-4 w-4"/> Messages
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">B2B Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                           {isLoadingMetrics ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</div>}
                           <p className="text-xs text-muted-foreground">Completed B2B orders</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active B2B Orders</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoadingMetrics ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{activeOrders}</div>}
                             <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingMetrics ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{pendingQuotes}</div>}
                            <p className="text-xs text-muted-foreground">New RFQs awaiting response</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Quick Access</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link href={action.href} key={action.title} onClick={() => handleFeatureClick(`quick_access:${action.title.toLowerCase().replace(/ /g, '_')}`)}>
                            <Card className="group flex flex-col items-center justify-center text-center gap-4 p-4 hover:bg-muted/50 transition-colors h-full">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    {action.icon}
                                </div>
                                <div>
                                    <h4 className="font-semibold">{action.title}</h4>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent B2B Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="orders">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                            <TabsTrigger value="quotes">Recent Quotations</TabsTrigger>
                        </TabsList>
                        <TabsContent value="orders" className="mt-4">
                            <Table>
                                <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingOrders ? Array.from({length: 2}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-9 w-28" /></TableCell>
                                        </TableRow>
                                    )) :
                                    ordersData && ordersData.length > 0 ? ordersData.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                                            <TableCell>{order.buyerName || 'Tradinta Buyer'}</TableCell>
                                            <TableCell>KES {order.totalAmount.toLocaleString()}</TableCell>
                                            <TableCell><Badge variant={order.status === 'Shipped' || order.status === 'Delivered' ? 'secondary' : 'default'}>{order.status}</Badge></TableCell>
                                            <TableCell><Button size="sm" asChild><Link href={`/dashboards/seller-centre/orders/${order.id}`}>View Order</Link></Button></TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No recent B2B orders.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                             <CardFooter className="pt-4 justify-center">
                                <Button variant="link" asChild>
                                    <Link href="/dashboards/seller-centre/orders">View All Orders <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </CardFooter>
                        </TabsContent>
                        <TabsContent value="quotes" className="mt-4">
                             <Table>
                                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Buyer</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingQuotes ? Array.from({length: 2}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-9 w-28" /></TableCell>
                                        </TableRow>
                                    )) :
                                    quotationsData && quotationsData.length > 0 ? quotationsData.map((quote) => (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-medium">{quote.productName}</TableCell>
                                            <TableCell>{quote.buyerName}</TableCell>
                                            <TableCell>{new Date(quote.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                                            <TableCell><Badge variant={quote.status === 'New' ? 'default' : 'outline'}>{quote.status}</Badge></TableCell>
                                            <TableCell><Button size="sm" asChild><Link href={`/dashboards/seller-centre/quotations/${quote.id}`}>View RFQ</Link></Button></TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No recent quotations.</TableCell></TableRow>}
                                </TableBody>
                             </Table>
                             <CardFooter className="pt-4 justify-center">
                                <Button variant="link" asChild>
                                    <Link href="/dashboards/seller-centre/quotations">View All Quotations <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </CardFooter>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>

        
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Shop Profile</CardTitle>
                    <CardDescription>Complete your profile to attract more buyers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Profile Completeness</p>
                        <p className="text-sm font-bold">{profileCompleteness}%</p>
                    </div>
                    <Progress value={profileCompleteness} className="h-2" />
                </CardContent>
                <CardFooter>
                    <Button asChild variant="secondary" className="w-full" onClick={() => handleFeatureClick('profile:edit_shop')}>
                        <Link href="/dashboards/seller-centre/profile">Edit Shop Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardFooter>
            </Card>

            {user && <VerificationStatusCard manufacturerId={user.uid} />}
            
             <Card>
                <CardHeader>
                    <CardTitle>Growth Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                     <Link href="/dashboards/seller-centre/direct" className="block p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50">
                        <div className="flex items-center gap-3">
                           <Image src="https://i.postimg.cc/26pxzhHv/image.png" alt="Tradinta Direct Logo" width={64} height={64} />
                            <div>
                                <h4 className="font-semibold text-sm">Sell on Tradinta Direct</h4>
                                <p className="text-xs text-muted-foreground">List products for consumers and let us handle fulfillment.</p>
                            </div>
                        </div>
                     </Link>
                      <Link href="/dashboards/seller-centre/foundry" className="block p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50">
                        <div className="flex items-center gap-3">
                            <Image src="https://i.postimg.cc/VkfCYdsM/image.png" alt="The Foundry Logo" width={64} height={64} />
                            <div>
                                <h4 className="font-semibold text-sm">Forge a Deal</h4>
                                <p className="text-xs text-muted-foreground">Partner with influencers for group-buying campaigns.</p>
                            </div>
                        </div>
                     </Link>
                </CardContent>
             </Card>

        </div>
      </div>
    </div>
  );
}
