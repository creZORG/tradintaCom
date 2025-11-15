

'use client';

import * as React from 'react';
import { useParams, notFound } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Logo } from '@/components/logo';
import type { Manufacturer } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

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
    buyerId: string;
    buyerName: string;
    subtotal?: number;
    platformFee?: number;
    processingFee?: number;
    totalAmount: number;
    status: string;
    orderDate: any;
    items: OrderItem[];
};

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || 'N/A'}</p>
    </div>
);

export default function InvoicePage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const firestore = useFirestore();
    
    const [seller, setSeller] = React.useState<Partial<Manufacturer> | null>(null);

    const orderDocRef = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return doc(firestore, 'orders', orderId);
    }, [firestore, orderId]);

    const { data: order, isLoading } = useDoc<Order>(orderDocRef);
    
    React.useEffect(() => {
        if (order?.sellerId) {
            const fetchSeller = async () => {
                const sellerRef = doc(firestore, 'manufacturers', order.sellerId);
                const sellerSnap = await getDoc(sellerRef);
                if (sellerSnap.exists()) {
                    setSeller(sellerSnap.data());
                }
            };
            fetchSeller();
        }
    }, [order, firestore]);

    if (isLoading) {
        return (
            <div className="bg-muted min-h-screen py-12 px-4">
                <div className="max-w-4xl mx-auto bg-background p-8 rounded-lg shadow-lg">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }

    if (!order) {
        return notFound();
    }
    
    return (
        <div className="bg-muted min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto bg-background p-8 sm:p-12 rounded-lg shadow-lg" id="invoice-content">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Logo className="h-12 w-auto mb-2" />
                        <h1 className="text-2xl font-bold font-headline text-primary">Proforma Invoice</h1>
                        <p className="text-muted-foreground">Order ID: {order.id}</p>
                    </div>
                     <div className="text-right">
                        <h2 className="font-semibold text-lg">{seller?.shopName || order.sellerName}</h2>
                        <p className="text-sm text-muted-foreground">{seller?.address}</p>
                        <p className="text-sm text-muted-foreground">{seller?.contactEmail || seller?.email}</p>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="grid sm:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold mb-2">Bill To:</h3>
                        <p className="font-medium">{order.buyerName}</p>
                        {/* Add more buyer details if available */}
                    </div>
                    <div className="text-left sm:text-right">
                        <DetailItem label="Invoice Date" value={new Date(order.orderDate.seconds * 1000).toLocaleDateString()} />
                        <DetailItem label="Payment Status" value={order.status} />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Description</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.items.map(item => (
                             <TableRow key={item.productId}>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">KES {item.unitPrice.toLocaleString()}</TableCell>
                                <TableCell className="text-right">KES {(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                 <div className="flex justify-end mt-8">
                    <div className="w-full max-w-sm space-y-4">
                        <div className="flex justify-between items-center text-sm">
                           <p className="text-muted-foreground">Subtotal</p>
                           <p className="font-semibold">KES {(order.subtotal || 0).toLocaleString()}</p>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                           <p className="text-muted-foreground">Platform Fee</p>
                           <p className="font-semibold">KES {(order.platformFee || 0).toLocaleString()}</p>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                           <p className="text-muted-foreground">Processing Fee</p>
                           <p className="font-semibold">KES {(order.processingFee || 0).toLocaleString()}</p>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-lg">
                            <p className="font-bold">Total Amount Due</p>
                            <p className="font-bold text-primary">KES {order.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                 <Separator className="my-8" />
                 
                 <div className="text-center text-muted-foreground text-xs">
                    <p>Thank you for your business! Please proceed to the order page to complete your payment.</p>
                    <p>Tradinta Inc. • Nairobi, Kenya • hello@tradinta.com</p>
                 </div>
            </div>
             <div className="max-w-4xl mx-auto text-center mt-6 print-hidden">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print or Save as PDF
                </Button>
            </div>
            <style jsx global>{`
                @media print {
                    body {
                        background-color: #fff;
                    }
                    .print-hidden {
                        display: none;
                    }
                }
            `}</style>
        </div>
    )
}
