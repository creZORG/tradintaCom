
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Truck, CheckCircle, Package, FileText, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase, addDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { nanoid } from 'nanoid';

type OrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
    shopId?: string;
};

type Order = {
    id: string;
    buyerName: string;
    buyerId: string;
    totalAmount: number;
    status: 'Pending Payment' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    orderDate: any;
    items: OrderItem[];
    shippingAddress: string;
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
};


const DetailItem = ({ label, value }: { label: string; value: string | number | null | React.ReactNode }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || 'N/A'}</p>
    </div>
);

export default function B2COrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState(false);

    const orderDocRef = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return doc(firestore, 'orders', orderId);
    }, [firestore, orderId]);
    
    const paymentQuery = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return query(collection(firestore, 'payments'), where('orderId', '==', orderId), limit(1));
    }, [firestore, orderId]);


    const { data: order, isLoading: isLoadingOrder } = useDoc<Order>(orderDocRef);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentQuery);
    
    const payment = payments?.[0];
    const isLoading = isLoadingOrder || isLoadingPayments;

    const handleUpdateStatus = async (newStatus: Order['status']) => {
        if (!orderDocRef || !order || !firestore) return;

        setIsUpdating(true);
        try {
            await updateDoc(orderDocRef, {
                status: newStatus,
                [`statusHistory.${newStatus.toLowerCase()}`]: serverTimestamp(),
            });

            // If marking as shipped, create the shipment record for logistics
            if (newStatus === 'Shipped') {
                const shipmentRef = doc(firestore, 'shipments', nanoid());
                await setDoc(shipmentRef, {
                    id: shipmentRef.id,
                    orderId: order.id,
                    buyerId: order.buyerId,
                    shippingAddress: order.shippingAddress,
                    status: 'Pending Pickup',
                    items: order.items,
                    createdAt: serverTimestamp(),
                    shippedAt: serverTimestamp(),
                });
                toast({ title: 'Shipment Created', description: 'The logistics team has been notified.' });
            }

            toast({
                title: 'Order Status Updated',
                description: `Order has been marked as ${newStatus}.`,
            });

        } catch (error: any) {
            toast({
                title: 'Update Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-2 space-y-6">
                         <Skeleton className="h-48 w-full" />
                         <Skeleton className="h-24 w-full" />
                    </div>
                     <div className="md:col-span-1 space-y-6">
                         <Skeleton className="h-80 w-full" />
                    </div>
                </div>
            </div>
        )
    }
    
    if (!order) {
        return <div>Order not found.</div>;
    }
    
    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <Link href="/dashboards/tradinta-direct-admin">Tradinta Direct Admin</Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Order Details</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/tradinta-direct-admin"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Order #{order.id.substring(0, 8)}...
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                     {order.status === 'Processing' && (
                        <Button onClick={() => handleUpdateStatus('Shipped')} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Truck className="mr-2 h-4 w-4" />} Mark as Shipped
                        </Button>
                     )}
                      {order.status === 'Shipped' && (
                        <Button onClick={() => handleUpdateStatus('Delivered')} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />} Mark as Delivered
                        </Button>
                     )}
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Order Items ({order.items.length})</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Unit Price</TableHead><TableHead>Subtotal</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {order.items.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>KES {item.unitPrice.toLocaleString()}</TableCell>
                                            <TableCell>KES {(item.unitPrice * item.quantity).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                             </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Payment Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {payment ? (
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <DetailItem label="Status" value={<Badge variant={payment.status === 'Completed' ? 'secondary' : 'destructive'}>{payment.status}</Badge>} />
                                    <DetailItem label="Amount Paid" value={`KES ${payment.amount.toLocaleString()}`} />
                                    <DetailItem label="Method" value={payment.paymentMethod} />
                                    <DetailItem label="Transaction ID" value={payment.transactionId} />
                                    <DetailItem label="Paystack Ref" value={payment.reference} />
                                    <DetailItem label="Payment Date" value={new Date(payment.paymentDate.seconds * 1000).toLocaleString()} />
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No payment record found for this order.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Order Details</CardTitle>
                            <CardDescription>Status: <Badge>{order.status}</Badge></CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem label="Order ID" value={order.id} />
                            <DetailItem label="Order Date" value={new Date(order.orderDate.seconds * 1000).toLocaleString()} />
                            <Separator />
                            <DetailItem label="Customer Name" value={order.buyerName} />
                            <DetailItem label="Customer ID" value={order.buyerId} />
                             <div>
                                <p className="text-sm text-muted-foreground">Shipping Address</p>
                                <p className="font-semibold">{order.shippingAddress || 'Not Provided'}</p>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center font-bold">
                                <span>Total Amount</span>
                                <span>KES {order.totalAmount.toLocaleString()}</span>
                            </div>
                        </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    )
}
