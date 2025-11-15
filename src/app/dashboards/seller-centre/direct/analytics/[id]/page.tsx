
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  Eye,
  ShoppingCart,
  TrendingUp,
  Package,
  Percent,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Image from 'next/image';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, BarChart } from 'recharts';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';


type ProductData = {
  name: string;
  description: string;
  imageUrl: string;
  variants: { price: number; retailPrice?: number; stock: number; b2cStock?: number; }[];
  status: 'draft' | 'published' | 'archived';
};

type OrderData = {
    items: { productId: string; quantity: number; unitPrice: number; }[];
    orderDate: Timestamp;
    totalAmount: number;
    shippingAddress?: string;
}

const StatCard = ({ title, value, isLoading, icon, description }: { title: string, value: string, isLoading: boolean, icon: React.ReactNode, description?: string }) => (
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


export default function B2CProductAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const productDocRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore || !productId) return null;
    return doc(firestore, 'manufacturers', user.uid, 'products', productId);
  }, [firestore, user, productId]);

  const { data: product, isLoading: isLoadingProduct } = useDoc<ProductData>(productDocRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return query(
        collection(firestore, 'orders'),
        where('isTradintaDirect', '==', true),
        where('items', 'array-contains', { productId: productId }) // This is not a valid firestore query. We will filter client side
    );
  }, [firestore, productId]);
  
  const { data: allOrders, isLoading: isLoadingOrders } = useCollection<OrderData>(ordersQuery);

  const isLoading = isLoadingProduct || isLoadingOrders;

  const analyticsData = React.useMemo(() => {
    if (!allOrders || !product) return null;
    
    const productOrders = allOrders.filter(order => order.items.some(item => item.productId === productId));

    const totalRevenue = productOrders.reduce((sum, order) => {
        const item = order.items.find(i => i.productId === productId);
        return sum + (item ? item.quantity * item.unitPrice : 0);
    }, 0);

    const unitsSold = productOrders.reduce((sum, order) => {
        const item = order.items.find(i => i.productId === productId);
        return sum + (item ? item.quantity : 0);
    }, 0);

    const avgSellingPrice = unitsSold > 0 ? totalRevenue / unitsSold : 0;
    
    const locationCounts = productOrders.reduce((acc, order) => {
        const county = order.shippingAddress?.split(',')[1]?.trim();
        if (county) {
            acc[county] = (acc[county] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const topLocation = Object.entries(locationCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    // Sales over time (last 7 days)
    const weekStart = startOfWeek(new Date());
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: new Date() });
    const salesByDay = daysInWeek.map(day => ({
        name: format(day, 'MMM d'),
        Sales: 0,
    }));

    productOrders.forEach(order => {
        const orderDate = order.orderDate.toDate();
        const dayString = format(orderDate, 'MMM d');
        const dayData = salesByDay.find(d => d.name === dayString);
        if (dayData) {
            const item = order.items.find(i => i.productId === productId);
            dayData.Sales += item ? item.quantity : 0;
        }
    });

    return {
        totalRevenue,
        unitsSold,
        avgSellingPrice,
        topLocation,
        salesChartData: salesByDay
    };
  }, [allOrders, product, productId]);


  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </div>
    )
  }

  if (!product) {
    return (
        <div>
            <h1 className="text-xl font-semibold">Product not found.</h1>
            <p className="text-muted-foreground">The requested product could not be loaded.</p>
             <Button variant="link" asChild><Link href="/dashboards/seller-centre/direct">Go Back</Link></Button>
        </div>
    )
  }

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
             <BreadcrumbLink asChild>
               <Link href={`/dashboards/seller-centre/direct`}>Tradinta Direct</Link>
             </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>B2C Product Analytics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href={`/dashboards/seller-centre/direct`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="relative w-16 h-16 rounded-md overflow-hidden">
            <Image src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'} alt={product.name} fill className="object-cover" />
        </div>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {product.name}
        </h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="B2C Revenue" value={`KES ${analyticsData?.totalRevenue.toLocaleString() || 0}`} icon={<DollarSign />} isLoading={isLoading} />
        <StatCard title="Units Sold" value={`${analyticsData?.unitsSold || 0}`} icon={<ShoppingCart />} isLoading={isLoading} />
        <StatCard title="Product Page Views" value="N/A" icon={<Eye />} isLoading={isLoading} description="Tracking coming soon"/>
        <StatCard title="Conversion Rate" value="N/A" icon={<Percent />} isLoading={isLoading} description="Tracking coming soon" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Sales Over Time</CardTitle>
                <CardDescription>Daily B2C units sold for this product over the last week.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Sales" fill="hsl(var(--primary))" name="Units Sold" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
           <div className="space-y-4">
             <StatCard title="Average Selling Price" value={`KES ${analyticsData?.avgSellingPrice.toFixed(2) || '0.00'}`} icon={<TrendingUp />} isLoading={isLoading} description="After promotions" />
             <StatCard title="B2C Stock" value={`${product.variants[0]?.b2cStock || 0} units`} icon={<Package />} isLoading={isLoading} description={`Total Stock: ${product.variants[0]?.stock || 0}`} />
             <StatCard title="Top Buyer Location" value={analyticsData?.topLocation || 'N/A'} icon={<MapPin />} isLoading={isLoading} description="Most frequent delivery county" />
           </div>
      </div>
    </div>
  );
}
