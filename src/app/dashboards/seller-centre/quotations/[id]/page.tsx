
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useUser,
  useFirestore,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  MessageSquare,
  DollarSign,
  Send,
  Loader2,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { sendQuotationResponseEmail } from '@/app/lib/actions/auth';


type Quotation = {
  id: string;
  buyerName: string;
  buyerId: string;
  productName: string;
  productId: string;
  productImageUrl?: string;
  tiers: { quantity: number; targetPrice?: number }[];
  deliveryAddress?: string;
  proposedPaymentTerm?: string;
  technicalRequirements?: string;
  attachments?: string[];
  message: string;
  createdAt: any;
  status: 'New' | 'Responded' | 'Accepted' | 'Archived';
  response?: {
    unitPrice: number;
    totalPrice: number;
    message: string;
    respondedAt: any;
  }
};

const DetailItem = ({ label, value, className }: { label: string; value?: string | number | null, className?: string }) => (
  <div className={className}>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="font-semibold">{value || 'Not provided'}</p>
  </div>
);

export default function QuotationDetailPage() {
  const params = useParams();
  const quotationId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [unitPrice, setUnitPrice] = useState<string>('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quotationDocRef = useMemoFirebase(() => {
    if (!user || !firestore || !quotationId) return null;
    return doc(firestore, 'manufacturers', user.uid, 'quotations', quotationId);
  }, [user, firestore, quotationId]);

  const { data: quotation, isLoading, forceRefetch } = useDoc<Quotation>(quotationDocRef);
  
  const totalPrice = useMemo(() => {
    const price = parseFloat(unitPrice);
    if (!isNaN(price) && quotation?.tiers?.[0]?.quantity) {
        // For simplicity, we calculate total based on the first tier for now
        return (price * quotation.tiers[0].quantity).toFixed(2);
    }
    return '0.00';
  }, [unitPrice, quotation?.tiers]);

  const handleSubmitResponse = async () => {
    if (!unitPrice || !responseMessage || !quotationDocRef || !quotation) return;
    setIsSubmitting(true);
    
    const responseData = {
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalPrice),
        message: responseMessage,
        respondedAt: serverTimestamp(),
    };

    try {
        // Find buyer's email
        const buyerDoc = await getDoc(doc(firestore, 'users', quotation.buyerId));
        if (!buyerDoc.exists()) throw new Error("Buyer profile not found.");
        const buyerEmail = buyerDoc.data().email;
        if (!buyerEmail) throw new Error("Buyer email not available.");

        await updateDocumentNonBlocking(quotationDocRef, {
            status: 'Responded',
            response: responseData,
        });

        const buyerQuotationRef = doc(firestore, 'users', quotation.buyerId, 'quotations', quotationId);
        await updateDocumentNonBlocking(buyerQuotationRef, {
            status: 'Responded',
            response: responseData,
        });

        // Send email notification
        await sendQuotationResponseEmail({
            to: buyerEmail,
            buyerName: quotation.buyerName,
            sellerName: user?.displayName || 'A Tradinta Seller',
            productName: quotation.productName,
            quotePrice: responseData.unitPrice,
            quoteLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboards/buyer/quotations/${quotationId}`
        });

        toast({
            title: 'Response Sent!',
            description: 'Your quotation has been sent to the buyer.'
        })
        forceRefetch(); // Force a refetch to update the UI
    } catch (error: any) {
        toast({
            title: 'Error Sending Response',
            description: error.message,
            variant: 'destructive',
        })
    } finally {
        setIsSubmitting(false);
    }

  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!quotation) {
    return <div>Quotation not found.</div>;
  }

  const hasResponded = quotation.status === 'Responded' || quotation.status === 'Accepted';

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
              <Link href="/dashboards/seller-centre/quotations">Quotations</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>RFQ Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboards/seller-centre/quotations">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Quotation Request: {quotation.productName}
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Buyer's Request</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar>
                            <AvatarImage />
                            <AvatarFallback>{quotation.buyerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{quotation.buyerName}</p>
                            <p className="text-xs text-muted-foreground">
                                Requested on {format(quotation.createdAt.toDate(), 'PPP')}
                            </p>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <DetailItem label="Product" value={quotation.productName} />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Quantity Tiers</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                                {quotation.tiers?.map((tier, i) => (
                                    <div key={i} className="p-2 border rounded-md bg-muted/30">
                                        <p className="font-semibold">{tier.quantity.toLocaleString()} units</p>
                                        <p className="text-xs text-muted-foreground">
                                            {tier.targetPrice ? `Target: KES ${tier.targetPrice.toLocaleString()}/unit` : 'No target price'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DetailItem label="Delivery Address" value={quotation.deliveryAddress} />
                        <DetailItem label="Proposed Payment Term" value={quotation.proposedPaymentTerm} />
                         <div>
                             <p className="text-sm font-medium text-muted-foreground">Technical Requirements</p>
                             <blockquote className="mt-1 border-l-2 pl-4 italic text-sm">
                                {quotation.technicalRequirements || "None provided."}
                             </blockquote>
                        </div>
                        <div>
                             <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                            {quotation.attachments && quotation.attachments.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {quotation.attachments.map((file, i) => (
                                        <Button key={i} variant="outline" size="sm" asChild>
                                            <a href={file} target="_blank" rel="noopener noreferrer">
                                                <FileText className="mr-2 h-4 w-4"/> Attachment {i+1}
                                            </a>
                                        </Button>
                                    ))}
                                </div>
                            ): (
                                 <p className="text-sm font-semibold">None</p>
                            )}
                        </div>
                        <div>
                             <p className="text-sm font-medium text-muted-foreground">Buyer's Message</p>
                             <blockquote className="mt-1 border-l-2 pl-4 italic text-sm">
                                {quotation.message || "No additional message provided."}
                             </blockquote>
                        </div>
                     </div>
                </CardContent>
            </Card>

            {hasResponded && quotation.response && (
                 <Card className="bg-green-50 dark:bg-green-900/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-600"/>Your Response</CardTitle>
                         <CardDescription>Sent on {quotation.response.respondedAt ? format(quotation.response.respondedAt.toDate(), 'PPP') : 'sending...'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Quoted Unit Price" value={`KES ${quotation.response.unitPrice.toLocaleString()}`} />
                            <DetailItem label="Total Price" value={`KES ${quotation.response.totalPrice.toLocaleString()}`} />
                        </div>
                        <div>
                             <p className="text-sm font-medium text-muted-foreground">Your Message</p>
                             <blockquote className="mt-2 border-l-2 pl-6 italic text-sm">
                                {quotation.response.message}
                             </blockquote>
                        </div>
                    </CardContent>
                    {quotation.status === 'Accepted' && (
                        <CardFooter>
                            <p className="text-sm font-semibold text-green-700">The buyer has accepted this quote and an order has been created.</p>
                        </CardFooter>
                    )}
                 </Card>
            )}
            
        </div>
        <div className="md:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare /> Respond to Buyer
                    </CardTitle>
                    <CardDescription>
                        Provide your pricing and terms for this request.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="unit-price">Unit Price (KES)</Label>
                        <Input id="unit-price" type="number" placeholder="e.g. 5000" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} disabled={hasResponded} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="total-price">Total Price (KES)</Label>
                        <Input id="total-price" type="text" value={totalPrice} readOnly disabled className="bg-muted" />
                         <p className="text-xs text-muted-foreground">Calculated based on the first quantity tier.</p>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="response-message">Your Message</Label>
                         <Textarea id="response-message" placeholder="Include payment terms, delivery details, and validity of this quote." value={responseMessage} onChange={e => setResponseMessage(e.target.value)} disabled={hasResponded} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSubmitResponse} disabled={isSubmitting || hasResponded}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        {hasResponded ? 'Response Sent' : 'Send Quotation'}
                    </Button>
                </CardFooter>
             </Card>
        </div>
      </div>

    </div>
  );
}
