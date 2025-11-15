
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Truck, CheckCircle, Clock, Eye, FileSignature, Wallet, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaystackPayment } from 'react-paystack';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

type Order = {
    id: string;
    productName?: string;
    sellerName?: string;
    totalAmount: number;
    status: string;
    buyerId: string;
    orderDate: any;
    items?: { productName: string }[];
};

type Quotation = {
    id: string;
    productName: string;
    sellerName: string;
    status: 'New' | 'Responded' | 'Accepted' | 'Archived';
    createdAt: any;
}


const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Delivered':
        case 'Accepted':
            return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'Processing':
        case 'Shipped':
            return <Badge><Truck className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'New':
        case 'Pending':
        case 'Pending Payment':
            return <Badge variant="outline"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
        case 'Responded':
            return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><FileSignature className="mr-1 h-3 w-3"/>{status}</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

const PayNowButton = ({ order }: { order: Order }) => {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const config = {
        reference: new Date().getTime().toString(),
        email: user?.email || '',
        amount: order.totalAmount * 100, // Paystack amount is in kobo
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            orderId: order.id,
            buyerId: order.buyerId,
        }
    };

    const initializePayment = usePaystackPayment(config);

    const onSuccess = async (transaction: any) => {
        try {
            const response = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: transaction.reference, orderId: order.id }),
            });
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.details || 'Payment verification failed on the server.');
            }

            toast({
                title: "Payment Successful!",
                description: "Redirecting to your order confirmation...",
            });
            router.push(`/orders/${order.id}`);
            
        } catch (error: any) {
             toast({
                title: "Order Processing Failed",
                description: `Your payment was successful, but we couldn't finalize your order. Please contact support with reference: ${transaction.reference}. Error: ${error.message}`,
                variant: 'destructive',
                duration: 10000,
            });
        }
    };

    const onClose = () => {
        // User closed the popup
    };

    return (
        <Button size="sm" onClick={() => initializePayment({onSuccess, onClose})}>
            <Wallet className="mr-2 h-4 w-4"/> Pay Now
        </Button>
    );
};

function OrdersPageContent() {
  const { user } = useUser();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'orders'),
      where('buyerId', '==', user.uid),
      orderBy('orderDate', 'desc')
    );
  }, [user, firestore]);

  const quotationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Note: This requires a composite index on buyerId and createdAt
    return query(
        collection(firestore, 'users', user.uid, 'quotations'),
        orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);
  const { data: quotations, isLoading: isLoadingQuotations } = useCollection<Quotation>(quotationsQuery);

  const getOrderDescription = (order: Order) => {
    if (order.productName) return order.productName;
    if (order.items && order.items.length > 0) {
        const firstItem = order.items[0].productName;
        return order.items.length > 1 ? `${firstItem} + ${order.items.length - 1} more` : firstItem;
    }
    return 'Order Details';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            My Orders & Quotations
          </CardTitle>
          <CardDescription>
            Track your orders and manage your requests for quotation (RFQs) with suppliers.
          </CardDescription>
        </CardHeader>
      </Card>
      <Tabs defaultValue="orders">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="quotations">My Quotations (RFQs)</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>Review and track your current and past orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingOrders ? (
                                Array.from({length: 2}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-9 w-28" /></TableCell>
                                    </TableRow>
                                ))
                            ) : orders && orders.length > 0 ? (
                                orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                                        <TableCell>{getOrderDescription(order)}</TableCell>
                                        <TableCell>{order.sellerName}</TableCell>
                                        <TableCell>KES {order.totalAmount.toLocaleString()}</TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="space-x-2">
                                            {order.status === 'Pending Payment' ? (
                                                <PayNowButton order={order} />
                                            ) : (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/orders/${order.id}`}>
                                                        <Eye className="mr-2 h-4 w-4"/>View Order
                                                    </Link>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">You haven't placed any orders yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="quotations">
            <Card>
                <CardHeader>
                     <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Quotation History</CardTitle>
                            <CardDescription>Manage your price inquiries with sellers.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/products">
                                <FileText className="mr-2 h-4 w-4" /> New RFQ
                            </Link>
                        </Button>
                     </div>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingQuotations ? (
                                Array.from({length: 3}).map((_, i) => (
                                     <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-9 w-32" /></TableCell>
                                    </TableRow>
                                ))
                            ) : quotations && quotations.length > 0 ? (
                                quotations.map(quote => (
                                    <TableRow key={quote.id}>
                                        <TableCell className="font-medium">{quote.productName}</TableCell>
                                        <TableCell>{quote.sellerName}</TableCell>
                                        <TableCell>{getStatusBadge(quote.status)}</TableCell>
                                        <TableCell>{quote.createdAt ? new Date(quote.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboards/buyer/quotations/${quote.id}`}>
                                                    <Eye className="mr-2 h-4 w-4"/> View Details
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">You haven't requested any quotations yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function OrdersPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OrdersPageContent />
        </React.Suspense>
    )
}
