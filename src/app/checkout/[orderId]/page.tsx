
'use client';

import * as React from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Wallet, Loader2, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePaystackPayment } from 'react-paystack';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePromoCode } from '@/app/lib/actions/marketing';
import { Textarea } from '@/components/ui/textarea';

type OrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
};

type Order = {
    id: string;
    sellerId: string;
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
    buyerName?: string;
};

const DetailItem = ({ label, value }: { label: string; value?: string | number | null | React.ReactNode }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || 'N/A'}</p>
    </div>
);


export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);

    const [payerName, setPayerName] = React.useState('');
    const [payerEmail, setPayerEmail] = React.useState('');
    const [shippingAddress, setShippingAddress] = React.useState('');
    const [promoCode, setPromoCode] = React.useState('');
    const [discount, setDiscount] = React.useState(0);
    const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);

    const orderDocRef = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return doc(firestore, 'orders', orderId);
    }, [firestore, orderId]);

    const { data: order, isLoading: isLoadingOrder } = useDoc<Order>(orderDocRef);

    React.useEffect(() => {
        if (user) {
            setPayerName(order?.buyerName || user.displayName || '');
            setPayerEmail(user.email || '');
        }
    }, [user, order]);

    const subtotal = order?.subtotal || 0;
    const platformFee = order?.platformFee || 0;
    const processingFee = order?.processingFee || 0;
    const finalTotal = (order?.totalAmount || 0) - discount;

    const handleApplyPromoCode = async () => {
        if (!promoCode.trim() || !order) return;
        setIsApplyingPromo(true);
        const result = await validatePromoCode(promoCode, order.sellerId, subtotal);
        if (result.success) {
            setDiscount(result.discountAmount);
            toast({ title: 'Promo Code Applied!', description: `You saved KES ${result.discountAmount.toLocaleString()}`});
        } else {
            toast({ title: 'Invalid Promo Code', description: result.message, variant: 'destructive'});
            setDiscount(0);
        }
        setIsApplyingPromo(false);
    };

    const config = {
        reference: new Date().getTime().toString(),
        email: payerEmail,
        amount: Math.round(finalTotal * 100),
        currency: 'KES',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            orderId: order?.id,
            buyerId: user?.uid,
            promo_code_used: promoCode,
            discount_amount: discount,
        }
    };
    
    const initializePayment = usePaystackPayment(config);

    const onSuccess = async (transaction: any) => {
        if (!orderDocRef) return;
        setIsProcessing(true);
        toast({ title: "Payment Successful!", description: "Verifying and updating your order..."});
        
        try {
            await updateDoc(orderDocRef, {
                shippingAddress: shippingAddress,
                buyerName: payerName,
            });

            const response = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    reference: transaction.reference, 
                    orderId: order?.id,
                }),
            });
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.details || 'Payment verification failed on the server.');
            }
            
            toast({ title: "Order Confirmed!", description: `Your order #${order?.id.substring(0,8)} is now being processed.` });
            router.push(`/orders/${order?.id}?success=true`);

        } catch (error: any) {
             toast({
                title: "Order Processing Failed",
                description: `Your payment was successful, but we couldn't finalize your order. Please contact support with reference: ${transaction.reference}. Error: ${error.message}`,
                variant: 'destructive',
                duration: 10000,
            });
             setIsProcessing(false);
        }
    };

    const onClose = () => {
        toast({ title: 'Payment window closed.'});
    };
    
    const handlePay = () => {
        if(!payerEmail || !payerName || !shippingAddress) {
            toast({ title: 'Please fill in all your details.', variant: 'destructive'});
            return;
        }
        initializePayment(onSuccess, onClose);
    }

    if (isLoadingOrder) {
        return <div className="container mx-auto py-12 max-w-4xl"><Skeleton className="h-96 w-full" /></div>
    }
    
    if (!order) {
        return notFound();
    }
    
    if (order.status !== 'Pending Payment') {
        return (
             <div className="container mx-auto py-12 text-center">
                <h1 className="text-xl font-semibold">Order Not Pending</h1>
                <p>This order is already being processed or has been completed.</p>
                <Button asChild className="mt-4"><Link href={`/orders/${order.id}`}>View Order Status</Link></Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-12 max-w-4xl">
             <div className="flex flex-col items-center text-center mb-8">
                 <ShoppingCart className="w-12 h-12 text-primary mb-4" />
                 <h1 className="text-3xl font-bold font-headline">Secure Checkout</h1>
                 <p className="text-muted-foreground mt-2 max-w-xl">Please confirm your details and complete the payment for your order.</p>
            </div>
             <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                     <Card>
                        <CardHeader><CardTitle>1. Shipping & Contact</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="payerName">Full Name</Label>
                                <Input id="payerName" value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="John Doe" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="payerEmail">Email Address</Label>
                                <Input id="payerEmail" type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="you@example.com" required />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="shippingAddress">Shipping Address</Label>
                                <Textarea id="shippingAddress" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="123 Tradinta Lane, Nairobi, Kenya" required />
                            </div>
                        </CardContent>
                     </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>2. Order Summary</CardTitle><CardDescription>Order ID: {order.id}</CardDescription></CardHeader>
                        <CardContent className="space-y-3">
                            <DetailItem label="Subtotal" value={`KES ${subtotal.toLocaleString()}`} />
                            <DetailItem label="Platform Fee" value={`KES ${platformFee.toLocaleString()}`} />
                            <DetailItem label="Processing Fee" value={`KES ${processingFee.toLocaleString()}`} />
                            {discount > 0 && <DetailItem label="Promo Discount" value={`- KES ${discount.toLocaleString()}`} />}
                            <Separator/>
                            <DetailItem label="Total Amount" value={<span className="text-lg font-bold">KES {finalTotal.toLocaleString()}</span>} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>3. Payment</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input placeholder="Enter Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                                <Button onClick={handleApplyPromoCode} variant="outline" disabled={isApplyingPromo}>
                                    {isApplyingPromo ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Apply'}
                                </Button>
                            </div>
                            <Button size="lg" className="w-full" onClick={handlePay} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Wallet className="mr-2 h-5 w-5"/>}
                                 Pay KES {finalTotal.toLocaleString()}
                            </Button>
                        </CardContent>
                         <CardFooter>
                            <p className="text-xs text-muted-foreground text-center w-full">Securely powered by Paystack.</p>
                        </CardFooter>
                    </Card>
                </div>
             </div>
        </div>
    )
}
