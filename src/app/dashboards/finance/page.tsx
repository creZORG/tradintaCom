
'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileWarning, Landmark, Search, Loader2, AlertTriangle, Eye, ShoppingCart, DollarSign, Percent, BarChart } from "lucide-react";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportingTab } from '@/components/finance/ReportingTab';


const kycVerifications = [
    { id: 'KYC004', user: 'NewSeller Inc.', status: 'Pending', submitted: '2023-11-13' },
    { id: 'KYC005', user: 'BulkBuyer Ltd.', status: 'Action Required', submitted: '2023-11-12' },
];

type OrderItem = {
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
};

type Payment = {
    id: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    status: string;
    paymentDate: any;
    transactionId: string;
    reference: string;
    gatewayResponse?: string;
};

type Order = {
    id: string;
    buyerName: string;
    totalAmount: number;
    orderDate: any;
    items: OrderItem[];
};

type TopSpender = {
    userId: string;
    name: string;
    totalSpent: number;
};


const TransactionMonitoringTab = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchResult, setSearchResult] = React.useState<{ payment: Payment; order: Order; } | null>(null);
    const [searchError, setSearchError] = React.useState<string | null>(null);

    // --- State for new analytics ---
    const [topSpenders, setTopSpenders] = React.useState<TopSpender[]>([]);
    const [largestTransactions, setLargestTransactions] = React.useState<Payment[]>([]);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = React.useState(true);


    const recentPaymentsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'payments'), orderBy('paymentDate', 'desc'), limit(100)) : null,
    [firestore]);
    const { data: recentPayments, isLoading: isLoadingPayments } = useCollection<Payment>(recentPaymentsQuery);

    const analytics = React.useMemo(() => {
        if (!recentPayments) return null;
        const totalTransactions = recentPayments.length;
        const successfulTransactions = recentPayments.filter(p => p.status === 'Completed');
        const successRate = totalTransactions > 0 ? (successfulTransactions.length / totalTransactions) * 100 : 0;
        const totalVolume = successfulTransactions.reduce((sum, p) => sum + p.amount, 0);

        const channelCounts = recentPayments.reduce((acc, p) => {
            const channel = p.paymentMethod?.split(' - ')[1] || 'Unknown';
            acc[channel] = (acc[channel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topChannel = Object.entries(channelCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return { successRate, totalVolume, topChannel };

    }, [recentPayments]);

    // Effect to fetch top spenders and largest transactions
    React.useEffect(() => {
        if (!firestore) return;
        
        const fetchAnalytics = async () => {
            setIsAnalyticsLoading(true);
            try {
                // --- Fetch Top Spenders ---
                const ordersSnapshot = await getDocs(query(collection(firestore, 'orders'), where('status', 'in', ['Processing', 'Shipped', 'Delivered'])));
                const spenders: Record<string, { totalSpent: number, name: string }> = {};
                ordersSnapshot.forEach(doc => {
                    const order = doc.data() as Order;
                    if (order.buyerId && order.buyerName) {
                        spenders[order.buyerId] = {
                            totalSpent: (spenders[order.buyerId]?.totalSpent || 0) + order.totalAmount,
                            name: order.buyerName,
                        }
                    }
                });
                const sortedSpenders = Object.entries(spenders)
                    .map(([userId, data]) => ({ userId, ...data }))
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 5);
                setTopSpenders(sortedSpenders);
    
                // --- Fetch Largest Transactions ---
                const paymentsSnapshot = await getDocs(query(collection(firestore, 'payments'), where('status', '==', 'Completed'), orderBy('amount', 'desc'), limit(5)));
                setLargestTransactions(paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
            } catch (e) {
                console.error("Error fetching analytics data: ", e);
                toast({ title: 'Error', description: 'Could not load transaction analytics.', variant: 'destructive'});
            } finally {
                setIsAnalyticsLoading(false);
            }
        }

        fetchAnalytics();
    }, [firestore, toast]);


    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !firestore) return;

        setIsSearching(true);
        setSearchResult(null);
        setSearchError(null);

        try {
            let paymentSnap;
            const paymentQuery = query(collection(firestore, 'payments'), 
                where('transactionId', '==', searchQuery.trim()),
                limit(1));
            paymentSnap = await getDocs(paymentQuery);

            if (paymentSnap.empty) {
                const paymentRefQuery = query(collection(firestore, 'payments'), 
                    where('reference', '==', searchQuery.trim()),
                    limit(1));
                paymentSnap = await getDocs(paymentRefQuery);
            }

            if (!paymentSnap.empty) {
                const paymentDoc = paymentSnap.docs[0];
                const paymentData = { id: paymentDoc.id, ...paymentDoc.data() } as Payment;
                
                const orderRef = doc(firestore, 'orders', paymentData.orderId);
                const orderSnap = await getDoc(orderRef);
                
                if (orderSnap.exists()) {
                    setSearchResult({ payment: paymentData, order: { id: orderSnap.id, ...orderSnap.data() } as Order });
                } else {
                    setSearchError(`Payment found, but associated Order ID "${paymentData.orderId}" could not be located.`);
                }
            } else {
                const orderRef = doc(firestore, 'orders', searchQuery.trim());
                const orderSnap = await getDoc(orderRef);
                 if (orderSnap.exists()) {
                    const paymentQueryByOrder = query(collection(firestore, 'payments'), where('orderId', '==', orderSnap.id), limit(1));
                    const paymentSnapByOrder = await getDocs(paymentQueryByOrder);
                    if(!paymentSnapByOrder.empty) {
                        const paymentDoc = paymentSnapByOrder.docs[0];
                         setSearchResult({ payment: { id: paymentDoc.id, ...paymentDoc.data() } as Payment, order: { id: orderSnap.id, ...orderSnap.data() } as Order });
                    } else {
                        setSearchError(`Order found, but no associated payment record could be located. The order may be unpaid.`);
                    }
                } else {
                    setSearchError('No transaction or order found with that ID or reference.');
                }
            }

        } catch (error: any) {
            toast({ title: 'Search Error', description: error.message, variant: 'destructive' });
            setSearchError(error.message);
        } finally {
            setIsSearching(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Analytics</CardTitle>
                </CardHeader>
                 <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Volume (Last 100)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground"/></CardHeader>
                        <CardContent>{isLoadingPayments ? <Skeleton className="h-7 w-24"/> : <div className="text-2xl font-bold">KES {analytics?.totalVolume.toLocaleString()}</div>}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Success Rate (Last 100)</CardTitle><Percent className="h-4 w-4 text-muted-foreground"/></CardHeader>
                        <CardContent>{isLoadingPayments ? <Skeleton className="h-7 w-24"/> : <div className="text-2xl font-bold">{analytics?.successRate.toFixed(1)}%</div>}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Top Channel (Last 100)</CardTitle><BarChart className="h-4 w-4 text-muted-foreground"/></CardHeader>
                        <CardContent>{isLoadingPayments ? <Skeleton className="h-7 w-24"/> : <div className="text-2xl font-bold">{analytics?.topChannel}</div>}</CardContent>
                    </Card>
                </CardContent>
                 <CardContent className="grid gap-4 md:grid-cols-2">
                     <Card>
                        <CardHeader><CardTitle className="text-base">Top Buyers by Total Spend</CardTitle></CardHeader>
                        <CardContent>
                            {isAnalyticsLoading ? <Skeleton className="h-40 w-full" /> : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Buyer</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {topSpenders.map(s => (
                                            <TableRow key={s.userId}><TableCell>{s.name}</TableCell><TableCell className="text-right font-bold">KES {s.totalSpent.toLocaleString()}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                     </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base">Largest Single Transactions</CardTitle></CardHeader>
                         <CardContent>
                            {isAnalyticsLoading ? <Skeleton className="h-40 w-full" /> : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {largestTransactions.map(t => (
                                            <TableRow key={t.id}><TableCell className="font-mono text-xs">{t.orderId}</TableCell><TableCell className="text-right font-bold">KES {t.amount.toLocaleString()}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                     </Card>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Monitoring</CardTitle>
                    <CardDescription>Oversee all financial movements. Search by Order ID, Paystack Reference, or Transaction ID (e.g., M-Pesa Code).</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6 max-w-md">
                        <Input placeholder="Enter ID or Reference..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <Button type="submit" disabled={isSearching}>
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                            Search
                        </Button>
                    </form>
                    
                    {isSearching && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}

                    {searchError && !isSearching && (
                        <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
                            <AlertTriangle className="mx-auto h-10 w-10 text-destructive mb-2" />
                            <p className="font-semibold">Search Failed</p>
                            <p>{searchError}</p>
                        </div>
                    )}
                    
                    {searchResult && !isSearching && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                                <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div><p className="text-muted-foreground">Status</p><Badge variant={searchResult.payment.status === 'Completed' ? 'secondary' : 'destructive'}>{searchResult.payment.status}</Badge></div>
                                    <div><p className="text-muted-foreground">Amount</p><p className="font-semibold">KES {searchResult.payment.amount.toLocaleString()}</p></div>
                                    <div><p className="text-muted-foreground">Method</p><p className="font-semibold">{searchResult.payment.paymentMethod}</p></div>
                                    <div><p className="text-muted-foreground">Date</p><p className="font-semibold">{new Date(searchResult.payment.paymentDate.seconds * 1000).toLocaleString()}</p></div>
                                    <div className="md:col-span-2"><p className="text-muted-foreground">Paystack Reference</p><p className="font-mono text-xs">{searchResult.payment.reference}</p></div>
                                    <div className="md:col-span-2"><p className="text-muted-foreground">Gateway Transaction ID</p><p className="font-mono text-xs">{searchResult.payment.transactionId}</p></div>
                                    {searchResult.payment.gatewayResponse && searchResult.payment.status !== 'Completed' && (
                                        <div className="md:col-span-4"><p className="text-muted-foreground">Gateway Response</p><p className="font-mono text-xs text-destructive">{searchResult.payment.gatewayResponse}</p></div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Order Details</span>
                                        <Button variant="outline" size="sm" asChild><Link href={`/dashboards/seller-centre/orders/${searchResult.order.id}`}><Eye className="mr-2 h-4 w-4" /> View Full Order</Link></Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {searchResult.order.items.map((item, index) => (
                                            <React.Fragment key={index}>
                                                <div className="flex items-center gap-4">
                                                    <Image src={item.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'} alt={item.productName} width={48} height={48} className="rounded-md object-cover" />
                                                    <div className="flex-grow">
                                                        <p className="font-semibold">{item.productName}</p>
                                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity} • Unit Price: KES {item.unitPrice.toLocaleString()}</p>
                                                    </div>
                                                    <p className="font-bold">KES {(item.quantity * item.unitPrice).toLocaleString()}</p>
                                                </div>
                                                {index < searchResult.order.items.length - 1 && <Separator />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function FinanceDashboard() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    
    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transaction Monitoring</TabsTrigger>
                <TabsTrigger value="reporting">Reporting</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
                <FinanceOverview />
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
                <TransactionMonitoringTab />
            </TabsContent>

            <TabsContent value="reporting" className="mt-4">
                <ReportingTab />
            </TabsContent>
        </Tabs>
    );
}
