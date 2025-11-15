
'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Truck, ShoppingCart, Wallet, FileText, UploadCloud, AlertTriangle, X, Landmark, Printer, ArrowRight, Flag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ReportModal } from '@/components/report-modal';

type OrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
};

type Order = {
    id: string;
    sellerId: string;
    sellerName: string;
    subtotal: number;
    platformFee: number;
    processingFee?: number;
    totalAmount: number;
    amountPaid?: number;
    balanceDue?: number;
    status: string;
    orderDate: any;
    items: OrderItem[];
    isTradintaDirect?: boolean;
    shippingAddress?: string;
    buyerName?: string;
    buyerId?: string;
};

const DetailItem = ({ label, value }: { label: string; value?: string | number | null | React.ReactNode }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || 'N/A'}</p>
    </div>
);


export default function OrderConfirmationPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.orderId as string;
    const isSuccess = searchParams.get('success') === 'true';

    const orderDocRef = useMemoFirebase(() => {
        if (!orderId) return null;
        return doc(doc(useFirestore(), 'orders', orderId));
    }, [orderId]);

    const { data: order, isLoading: isLoadingOrder } = useDoc<Order>(orderDocRef);

    if (isLoadingOrder) {
        return (
            <div className="container mx-auto py-12 max-w-4xl">
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="container mx-auto py-12 text-center">
                <h1 className="text-xl font-semibold">Order not found</h1>
                <p>The order you are looking for could not be found.</p>
                <Button asChild className="mt-4"><Link href="/dashboards/buyer/orders">View Your Orders</Link></Button>
            </div>
        )
    }
    
    if (!isSuccess) {
         return (
             <div className="container mx-auto py-12 max-w-2xl">
                 <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                        <CardDescription>Order ID: {order.id}</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <DetailItem label="Status" value={<Badge>{order.status}</Badge>} />
                        <DetailItem label="Total" value={`KES ${order.totalAmount.toLocaleString()}`} />
                        <ReportModal reportType="Order" referenceId={order.id}>
                             <Button variant="destructive" className="w-full mt-4">
                                <Flag className="mr-2 h-4 w-4"/> Raise a Dispute
                            </Button>
                        </ReportModal>
                     </CardContent>
                     <CardFooter className="flex-col gap-2">
                         <Button asChild className="w-full">
                            <Link href="/dashboards/buyer/orders">Back to My Orders</Link>
                         </Button>
                         <Button asChild variant="outline" className="w-full">
                            <Link href={`/invoice/${orderId}`} target="_blank">View Invoice</Link>
                         </Button>
                     </CardFooter>
                 </Card>
             </div>
         )
    }

    const isB2COrder = order.isTradintaDirect === true;
    const amountPaid = order.amountPaid || order.totalAmount;

    return (
        <div className="container mx-auto py-12 max-w-2xl">
            <Card className="overflow-hidden">
                <div className="p-8 bg-green-50 dark:bg-green-900/20 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold font-headline text-green-700 dark:text-green-300">Payment Successful!</h1>
                    <p className="text-muted-foreground mt-2">Your order has been confirmed and is now being processed.</p>
                </div>
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <DetailItem label="Order ID" value={order.id} />
                        <DetailItem label="Order Date" value={order.orderDate?.toDate().toLocaleDateString()} />
                        <DetailItem label="Paid By" value={order.buyerName} />
                        <DetailItem label="Amount Paid" value={`KES ${amountPaid.toLocaleString()}`} />
                    </div>

                    <Separator />
                    
                    <div>
                        <h4 className="font-semibold mb-2">Next Steps</h4>
                        {isB2COrder ? (
                            <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                                <Truck className="h-8 w-8 text-blue-600 mt-1"/>
                                <div>
                                    <h5 className="font-semibold">Fulfilled by Tradinta</h5>
                                    <p className="text-sm text-muted-foreground">Your items will be packed at our warehouse and shipped directly to you. You will receive a notification once your order is on its way.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                                <Factory className="h-8 w-8 text-blue-600 mt-1"/>
                                <div>
                                    <h5 className="font-semibold">Fulfilled by {order.sellerName}</h5>
                                    <p className="text-sm text-muted-foreground">The manufacturer has been notified and will begin processing your order. You can contact them directly from your dashboard if you have any questions.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-6 flex flex-col sm:flex-row gap-2">
                    <Button className="w-full sm:w-auto" asChild>
                        <Link href="/dashboards/buyer/orders">
                            <ShoppingCart className="mr-2 h-4 w-4"/>
                            View All My Orders
                        </Link>
                    </Button>
                    <Button className="w-full sm:w-auto" variant="outline" asChild>
                        <Link href={`/invoice/${orderId}`} target="_blank">
                             <Printer className="mr-2 h-4 w-4"/> View Invoice
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
