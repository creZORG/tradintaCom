
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp, collectionGroup } from "firebase/firestore";
import { subDays, format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Handshake, Landmark, ShoppingCart, TrendingUp, Wallet, Coins, Percent, Building, BarChart2, Sparkles, Users } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import type { Order as OrderDef, Product } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableRow } from '../ui/table';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Order = OrderDef & {
    totalAmount: number;
    subtotal: number;
    platformFee?: number;
    processingFee?: number;
    isTradintaDirect?: boolean;
    orderDate: Timestamp;
    items: { category?: string, sellerId?: string, sellerName?: string, unitPrice: number, quantity: number }[];
    sellerId: string;
    sellerName: string;
    relatedForgingEventId?: string;
};

type PartnerEarning = {
    unpaidEarnings: number;
};

type SellerEarning = {
    unpaidEarnings: number;
};

type AttributedSale = {
    saleAmount: number;
}

type MarketingPlan = {
    id: string;
    price: number;
}

type SubscribedSeller = {
    marketingPlanId: string;
}

const StatCard = ({ title, value, isLoading, icon, description, isClickable }: { title: string, value: string, isLoading: boolean, icon: React.ReactNode, description?: string, isClickable?: boolean }) => (
    <Card className={cn(isClickable && "transition-all hover:bg-muted/50 hover:shadow-md")}>
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

const PIE_CHART_COLORS = ['#0ea5e9', '#f97316', '#10b981', '#6366f1', '#ec4899'];


export function FinanceOverview() {
    const firestore = useFirestore();

    const thirtyDaysAgo = React.useMemo(() => subDays(new Date(), 30), []);

    const recentOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'orders'), where('orderDate', '>=', Timestamp.fromDate(thirtyDaysAgo)));
    }, [firestore, thirtyDaysAgo]);
    
    const attributedSalesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Assuming sales are logged with a date. If not, this query would need adjustment.
        return query(collectionGroup(firestore, 'attributedSales'), where('date', '>=', Timestamp.fromDate(thirtyDaysAgo)));
    }, [firestore, thirtyDaysAgo]);

    const partnerEarningsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partnerEarnings')) : null, [firestore]);
    const sellerEarningsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'sellerEarnings')) : null, [firestore]);
    const marketingPlansQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'marketingPlans')) : null, [firestore]);
    const subscribedSellersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'manufacturers'), where('marketingPlanId', '!=', null)) : null, [firestore]);
    
    const { data: recentOrders, isLoading: isLoadingOrders } = useCollection<Order>(recentOrdersQuery);
    const { data: attributedSales, isLoading: isLoadingSales } = useCollection<AttributedSale>(attributedSalesQuery);
    const { data: partnerEarnings, isLoading: isLoadingPartners } = useCollection<PartnerEarning>(partnerEarningsQuery);
    const { data: sellerEarnings, isLoading: isLoadingSellers } = useCollection<SellerEarning>(sellerEarningsQuery);
    const { data: marketingPlans, isLoading: isLoadingPlans } = useCollection<MarketingPlan>(marketingPlansQuery);
    const { data: subscribedSellers, isLoading: isLoadingSubscribed } = useCollection<SubscribedSeller>(subscribedSellersQuery);
    
    const isLoading = isLoadingOrders || isLoadingPartners || isLoadingSellers || isLoadingPlans || isLoadingSubscribed || isLoadingSales;

    const stats = React.useMemo(() => {
        if (!recentOrders || !partnerEarnings || !sellerEarnings || !marketingPlans || !subscribedSellers || !attributedSales) return null;

        const weeklyData = recentOrders.filter(order => order.orderDate.toDate() > subDays(new Date(), 7)).reduce((acc, order) => {
            const day = format(order.orderDate.toDate(), 'eee');
            acc[day] = (acc[day] || 0) + order.totalAmount;
            return acc;
        }, {} as Record<string, number>);
        
        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = dayOrder.map(day => ({ day, Revenue: weeklyData[day] || 0 }));

        const totalRevenue = recentOrders.reduce((sum, d) => sum + d.totalAmount, 0);
        const totalOrders = recentOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        const totalB2B = recentOrders.filter(o => !o.isTradintaDirect && !o.relatedForgingEventId).reduce((sum, d) => sum + d.totalAmount, 0);
        const totalB2C = recentOrders.filter(o => o.isTradintaDirect).reduce((sum, d) => sum + d.totalAmount, 0);
        const totalFoundry = recentOrders.filter(o => o.relatedForgingEventId).reduce((sum, d) => sum + d.totalAmount, 0);
        
        const totalPlatformFees = recentOrders.reduce((sum, d) => sum + (d.platformFee || 0), 0);
        const totalProcessingFees = recentOrders.reduce((sum, d) => sum + (d.processingFee || 0), 0);
        
        const totalPartnerPending = partnerEarnings.reduce((sum, p) => sum + p.unpaidEarnings, 0);
        const totalSellerPending = sellerEarnings.reduce((sum, s) => sum + s.unpaidEarnings, 0);
        
        const totalPendingPayouts = totalPartnerPending + totalSellerPending;

        const marketingRevenue = subscribedSellers.reduce((sum, seller) => {
            const plan = marketingPlans.find(p => p.id === seller.marketingPlanId);
            return sum + (plan?.price || 0);
        }, 0);
        
        const partnerAttributedRevenue = attributedSales.reduce((sum, s) => sum + s.saleAmount, 0);

        // Top Earning Sellers
        const sellerRevenue: Record<string, { name: string; total: number }> = {};
        recentOrders.forEach(order => {
            const sellerId = order.sellerId;
            const sellerName = order.sellerName || 'Unknown Seller';
            if (sellerId) {
                sellerRevenue[sellerId] = {
                    name: sellerName,
                    total: (sellerRevenue[sellerId]?.total || 0) + order.subtotal,
                };
            }
        });
        const topSellers = Object.values(sellerRevenue).sort((a,b) => b.total - a.total).slice(0, 5);

        // Revenue by Category
        const categoryRevenue: Record<string, number> = {};
        recentOrders.forEach(order => {
            order.items?.forEach(item => {
                const category = item.category || 'Uncategorized';
                categoryRevenue[category] = (categoryRevenue[category] || 0) + item.unitPrice * item.quantity;
            })
        });
        const topCategories = Object.entries(categoryRevenue).map(([name, revenue]) => ({ name, revenue })).sort((a,b) => b.revenue - a.revenue).slice(0, 5);


        return { 
            chartData, 
            totalRevenue, 
            avgOrderValue,
            totalB2B, 
            totalB2C, 
            totalFoundry,
            partnerAttributedRevenue,
            totalPlatformFees,
            totalProcessingFees,
            totalPendingPayouts,
            totalPartnerPending,
            totalSellerPending,
            marketingRevenue,
            topSellers,
            topCategories
        };

    }, [recentOrders, partnerEarnings, sellerEarnings, marketingPlans, subscribedSellers, attributedSales]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>TradePay & Financial Overview</CardTitle>
                <CardDescription>Financial overview for the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        title="Total Revenue (30d)"
                        value={`KES ${stats?.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                        isLoading={isLoading}
                        icon={<DollarSign />}
                    />
                     <StatCard 
                        title="Platform Fees Earned (30d)"
                        value={`KES ${stats?.totalPlatformFees.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                        isLoading={isLoading}
                        icon={<TrendingUp />}
                    />
                    <StatCard 
                        title="Total Pending Payouts"
                        value={`KES ${stats?.totalPendingPayouts.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                        isLoading={isLoading}
                        icon={<Wallet />}
                        description={`Sellers: ${stats?.totalSellerPending.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'} | Partners: ${stats?.totalPartnerPending.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                    />
                     <StatCard 
                        title="Marketing Revenue (MRR)"
                        value={`KES ${stats?.marketingRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                        isLoading={isLoading}
                        icon={<Coins />}
                        description="From plan subscriptions"
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                     <Link href="/dashboards/analytics?tab=overview&source=b2b" className="block">
                        <StatCard 
                            title="B2B Revenue (30d)"
                            value={`KES ${stats?.totalB2B.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                            isLoading={isLoading}
                            icon={<Landmark />}
                            isClickable
                        />
                     </Link>
                     <Link href="/dashboards/analytics?tab=overview&source=b2c" className="block">
                        <StatCard 
                            title="B2C Revenue (30d)"
                            value={`KES ${stats?.totalB2C.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                            isLoading={isLoading}
                            icon={<ShoppingCart />}
                            isClickable
                        />
                     </Link>
                     <Link href="/dashboards/analytics?tab=overview&source=foundry" className="block">
                        <StatCard 
                            title="Foundry Revenue (30d)"
                            value={`KES ${stats?.totalFoundry.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                            isLoading={isLoading}
                            icon={<Sparkles />}
                            isClickable
                        />
                     </Link>
                      <Link href="/dashboards/analytics?tab=overview&source=partner" className="block">
                        <StatCard 
                            title="Partner Attributed Revenue"
                            value={`KES ${stats?.partnerAttributedRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}`}
                            isLoading={isLoading}
                            icon={<Users />}
                            isClickable
                        />
                     </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Building /> Top Earning Sellers (30d)</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? <Skeleton className="h-40 w-full" /> : (
                                <Table>
                                    <TableBody>
                                        {stats?.topSellers.map(s => (
                                            <TableRow key={s.name}><TableCell>{s.name}</TableCell><TableCell className="text-right font-bold">KES {s.total.toLocaleString()}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                     <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><BarChart2 /> Revenue by Category (30d)</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {isLoading ? <Skeleton className="h-64 w-full" /> : (
                                <ResponsiveContainer width="100%" height={250}>
                                     <PieChart>
                                        <Pie data={stats?.topCategories} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {stats?.topCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Revenue by Day (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={stats?.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `KES ${Number(value) / 1000}k`} />
                                    <Tooltip
                                        formatter={(value: number) => `KES ${value.toLocaleString()}`}
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                    />
                                    <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}

    