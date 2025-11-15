
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/definitions';
import { Send, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from './logo';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { PhotoUpload } from './ui/photo-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import Image from 'next/image';
import { nanoid } from 'nanoid';
import { Card, CardContent } from '@/components/ui/card';

interface RequestQuoteModalProps {
  product: Product;
  children: React.ReactNode;
  source?: string;
}

type Tier = { id: string; quantity: string; targetPrice: string };

export function RequestQuoteModal({
  product,
  children,
  source,
}: RequestQuoteModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [tiers, setTiers] = React.useState<Tier[]>([{ id: nanoid(), quantity: '', targetPrice: '' }]);
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [paymentTerm, setPaymentTerm] = React.useState('');
  const [technicalRequirements, setTechnicalRequirements] = React.useState('');
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState('');

  const handleTierChange = (id: string, field: 'quantity' | 'targetPrice', value: string) => {
    setTiers(prevTiers => prevTiers.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const addTier = () => setTiers(prev => [...prev, { id: nanoid(), quantity: '', targetPrice: '' }]);
  const removeTier = (id: string) => setTiers(prev => prev.filter(t => t.id !== id));
  
  const handleAttachmentUpload = (url: string) => {
    setAttachments(prev => [...prev, url]);
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !firestore) {
        toast({
            title: 'Please log in',
            description: 'You must be logged in to request a quotation.',
            variant: 'destructive',
        });
        return;
    }
    
    if (tiers.every(t => !t.quantity)) {
        toast({ title: 'Please specify at least one quantity tier.', variant: 'destructive'});
        return;
    }
    
    setIsSubmitting(true);

    try {
        const quotationId = nanoid();
        
        const quotationData = {
            id: quotationId,
            buyerId: user.uid,
            buyerName: user.displayName || 'Anonymous Buyer',
            sellerId: product.manufacturerId,
            sellerName: (product as any).manufacturerName || 'Tradinta Seller',
            productId: product.id,
            productName: product.name,
            productImageUrl: product.imageUrl,
            source: source || 'unknown', // Add the source here
            tiers: tiers.filter(t => t.quantity).map(t => ({
                quantity: Number(t.quantity),
                targetPrice: t.targetPrice ? Number(t.targetPrice) : null,
            })),
            deliveryAddress,
            proposedPaymentTerm: paymentTerm,
            technicalRequirements,
            attachments,
            message,
            status: 'New',
            createdAt: serverTimestamp(),
        };

        // Create for Seller
        const sellerQuotationRef = doc(firestore, 'manufacturers', product.manufacturerId, 'quotations', quotationId);
        await setDoc(sellerQuotationRef, quotationData);
        
        // Create for Buyer
        const buyerQuotationRef = doc(firestore, 'users', user.uid, 'quotations', quotationId);
        await setDoc(buyerQuotationRef, quotationData);
        
        toast({
            title: "Quotation Request Sent!",
            description: `Your request for ${product.name} has been sent successfully.`,
        });

        setOpen(false); // Close the modal on success
    } catch (error: any) {
        toast({
            title: 'Submission Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <Logo className="w-24 mb-2" />
          <DialogTitle>Request for Quotation (RFQ)</DialogTitle>
          <DialogDescription>
            Provide detailed requirements to get an accurate quote from the seller.
          </DialogDescription>
        </DialogHeader>
        <form id="rfq-form" onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-8 gap-y-6 max-h-[70vh] overflow-y-auto pr-4">
          
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <Image src={product.imageUrl || 'https://placehold.co/100x100'} alt={product.name} width={60} height={60} className="rounded-md" />
                    <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">from {(product as any).manufacturerName || 'Tradinta Seller'}</p>
                    </div>
                </CardContent>
            </Card>

            <div>
                <Label className="font-semibold">Quantity Tiers</Label>
                <p className="text-xs text-muted-foreground mb-2">Request pricing for different quantities.</p>
                <div className="space-y-2">
                    {tiers.map((tier, index) => (
                        <div key={tier.id} className="flex items-center gap-2">
                            <Input type="number" placeholder="Quantity" value={tier.quantity} onChange={e => handleTierChange(tier.id, 'quantity', e.target.value)} />
                            <Input type="number" placeholder="Target Price/Unit (Optional)" value={tier.targetPrice} onChange={e => handleTierChange(tier.id, 'targetPrice', e.target.value)}/>
                            {tiers.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeTier(tier.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>}
                        </div>
                    ))}
                </div>
                 <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addTier}><PlusCircle className="mr-2 h-4 w-4"/>Add Tier</Button>
            </div>
            
            <div>
                <Label htmlFor="deliveryAddress" className="font-semibold">Delivery Address</Label>
                <Textarea id="deliveryAddress" placeholder="Enter your full delivery address" className="mt-1" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
            </div>
            
            <div>
                <Label htmlFor="payment-term" className="font-semibold">Proposed Payment Term</Label>
                <Select onValueChange={setPaymentTerm} value={paymentTerm}>
                    <SelectTrigger id="payment-term" className="mt-1"><SelectValue placeholder="Select a term..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="100_upfront">100% Upfront</SelectItem>
                        <SelectItem value="50_50">50% Upfront, 50% on Delivery</SelectItem>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="lpo">LPO Financing</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
             <div>
                <Label htmlFor="tech-reqs" className="font-semibold">Technical & Customization Requirements</Label>
                <Textarea id="tech-reqs" placeholder="e.g., Specific color codes, material grade, required certifications..." className="mt-1 min-h-24" value={technicalRequirements} onChange={e => setTechnicalRequirements(e.target.value)}/>
            </div>
            
            <div>
                 <Label className="font-semibold">Attach Files</Label>
                 <p className="text-xs text-muted-foreground mb-2">Upload spec sheets, drawings, etc.</p>
                 <PhotoUpload label="" onUpload={handleAttachmentUpload} />
                 {attachments.length > 0 && <div className="text-xs text-muted-foreground mt-2">{attachments.length} file(s) attached.</div>}
            </div>

            <div>
                <Label htmlFor="message" className="font-semibold">Additional Message</Label>
                <Textarea id="message" placeholder="Any other questions or comments for the seller." className="mt-1" value={message} onChange={e => setMessage(e.target.value)}/>
            </div>
          </div>

        </form>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button form="rfq-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
