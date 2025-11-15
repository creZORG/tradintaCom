
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Eye,
  ShoppingCart,
  Percent,
  BarChart2,
  ChevronLeft,
  DollarSign,
  Users,
  Link as LinkIcon,
  MapPin,
  TrendingUp,
  Loader2,
  Heart,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { logFeatureUsage } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { collection, query, where, orderBy, limit, Timestamp, getDocs, collectionGroup } from 'firebase/firestore';
import { InteractionService, ProductService } from '@/services';
import type { Product, Order as OrderDef } from '@/lib/definitions';
import { subDays, format, startOfWeek, eachDayOfInterval, formatISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type Order = OrderDef & {
    totalAmount: number;
    orderDate: Timestamp;
    isTradintaDirect?: boolean;
    shippingAddress?: string;
    items?: { unitPrice: number; quantity: number, productName: string }[];
};

type ProductData = Product & {
    wishlistCount?: number;
    viewCount?: number;
}

type TrafficSource = {
  source: string;
  count: number;
};

const PIE_CHART_COLORS = ['#0ea5e9', '#f97316', '#10b981', '#6366f1', '#ec4899'];

const StatCard = ({ title, value, icon, description, isLoading }: { title: string, value: string, icon: React.ReactNode, description?: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">{value}</div>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

export default function ShopAnalyticsPage() {
  const { user, role } = useUser();
  const firestore = useFirestore();

  const [trafficSources, setTrafficSources] = React.useState<TrafficSource[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = React.useState(true);

  React.useEffect(() => {
    if (user && role) {
      logFeatureUsage({
        feature: 'page:view',
        userId: user.uid,
        userRole: role,
        metadata: { page: '/dashboards/seller-centre/analytics' },
      });
    }
  }, [user, role]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    const thirtyDaysAgo = Timestamp.fromDate(subDays(new Date(), 30));
    return query(
        collection(firestore, 'orders'),
        where('sellerId', '==', user.uid),
        where('orderDate', '>=', thirtyDaysAgo)
    );
  }, [firestore, user]);
  
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'manufacturers', user.uid, 'products'));
  }, [firestore, user]);


  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);
  const { data: products, isLoading: isLoadingProducts } = useCollection<ProductData>(productsQuery);
  
  React.useEffect(() => {
    async function fetchTraffic() {
        if (!user?.uid || !firestore) return;
        setIsLoadingTraffic(true);
        const trafficRef = collection(firestore, `manufacturers/${user.uid}/trafficSources`);
        const trafficSnapshot = await getDocs(trafficRef);
        const sources: Record<string, number> = {};
        trafficSnapshot.forEach(doc => {
            const source = doc.data().source || 'Unknown';
            sources[source] = (sources[source] || 0) + 1;
        });
        const sortedSources = Object.entries(sources)
            .map(([name, count]) => ({ source: name, count }))
            .sort((a,b) => b.count - a.count)
            .slice(0,5); // Get top 5
        setTrafficSources(sortedSources);
        setIsLoadingTraffic(false);
    }
    fetchTraffic();
  }, [user, firestore]);
  
  const isLoading = isLoadingOrders || isLoadingTraffic || isLoadingProducts;

  const analyticsData = React.useMemo(() => {
    if (!orders || !products) return null;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const b2bOrders = orders.filter(o => !o.isTradintaDirect).length;
    const b2cOrders = orders.filter(o => o.isTradintaDirect).length;
    const productViews = products.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    const totalWishlists = products.reduce((sum, p) => sum + (p.wishlistCount || 0), 0);
    const conversionRate = productViews > 0 ? (totalOrders / productViews) * 100 : 0;
    
    const salesOverTime = orders.reduce((acc, order) => {
        const day = format(order.orderDate.toDate(), 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + order.totalAmount;
        return acc;
    }, {} as Record<string, number>);
    const salesOverTimeChart = Object.entries(salesOverTime).map(([name, revenue]) => ({ name, revenue }));

    const salesByChannel = [
        { name: 'B2B (Wholesale)', value: orders.filter(o => !o.isTradintaDirect).reduce((s, o) => s + o.totalAmount, 0)},
        { name: 'Tradinta Direct (B2C)', value: orders.filter(o => o.isTradintaDirect).reduce((s, o) => s + o.totalAmount, 0)},
    ];
    
    const topBuyerLocations = orders.reduce((acc, order) => {
        const location = order.shippingAddress?.split(',').pop()?.trim() || 'Unknown';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topBuyerLocationsChart = Object.entries(topBuyerLocations).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count).slice(0, 5);

    const productRevenue = orders.flatMap(o => o.items || []).reduce((acc, item) => {
      acc[item.productName] = (acc[item.productName] || 0) + (item.unitPrice * item.quantity);
      return acc;
    }, {} as Record<string, number>);

    const topProductsChart = Object.entries(productRevenue).map(([name, revenue]) => ({ name, revenue })).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
    
    return {
        kpis: {
            totalRevenue, totalOrders, b2bOrders, b2cOrders, productViews, conversionRate, totalWishlists,
        },
        salesOverTime: salesOverTimeChart,
        salesByChannel,
        topBuyerLocations: topBuyerLocationsChart,
        topProducts: topProductsChart,
    };
  }, [orders, products]);

  return (
    <div className="space-y-6">
       <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboards/seller-centre">Seller Centre</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Shop Analytics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/seller-centre"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
                </Button>
                <h1 className="text-xl font-semibold">Shop Analytics Dashboard</h1>
            </div>
        </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue (30d)" value={`KES ${analyticsData?.kpis.totalRevenue.toLocaleString('en-us', {maximumFractionDigits: 0}) || 0}`} icon={<DollarSign />} isLoading={isLoading} />
        <StatCard title="Total Orders (30d)" value={analyticsData?.kpis.totalOrders.toLocaleString() || '0'} icon={<ShoppingCart />} isLoading={isLoading} description={`${analyticsData?.kpis.b2bOrders || 0} B2B, ${analyticsData?.kpis.b2cOrders || 0} B2C`}/>
        <StatCard title="Product Views" value={analyticsData?.kpis.productViews.toLocaleString() || '0'} icon={<Eye />} isLoading={isLoading} description="Total views on all products" />
        <StatCard title="Total Wishlists" value={analyticsData?.kpis.totalWishlists.toLocaleString() || '0'} icon={<Heart />} isLoading={isLoading} description="Times products were wishlisted" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Sales Revenue Over Time (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.salesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tickFormatter={(val) => format(new Date(val), 'MMM d')} />
                        <YAxis tickFormatter={(value) => `KES ${Number(value) / 1000}k`} />
                        <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Top Selling Products (by Revenue)</CardTitle>
            </CardHeader>
            <CardContent>
                 {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={analyticsData?.topProducts} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {analyticsData?.topProducts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                        <Legend wrapperStyle={{fontSize: '12px'}}/>
                    </PieChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-2">
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin/>Top Buyer Locations (by County)</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                     <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={analyticsData?.topBuyerLocations}>
                             <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis/>
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(var(--accent))" name="Orders" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon />Top Traffic Sources</CardTitle></CardHeader>
                <CardContent>
                   {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                     <Table>
                        <TableHeader><TableRow><TableHead>Source</TableHead><TableHead className="text-right">Views</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {trafficSources.length > 0 ? trafficSources.map(source => (
                                <TableRow key={source.source}>
                                    <TableCell className="font-medium">{source.source}</TableCell>
                                    <TableCell className="text-right font-bold">{source.count}</TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">No traffic data yet.</TableCell></TableRow>}
                        </TableBody>
                     </Table>
                   )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
