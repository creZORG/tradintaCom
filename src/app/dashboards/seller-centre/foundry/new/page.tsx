
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Loader2,
  Save,
  PlusCircle,
  Trash2,
  TrendingUp,
  Percent,
  Search,
  Handshake,
  AlertTriangle,
  FilePenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, getDocs, serverTimestamp, getDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import type { Product } from '@/lib/definitions';


type Partner = {
  id: string;
  fullName: string;
  photoURL?: string;
  bio?: string;
  tradintaId?: string;
};

type Tier = {
    buyers: number;
    discount: number;
}

type ProductWithVariants = Product & {
    variants: { price: number }[];
}

const MarginHelper = ({ 
    unitCost, 
    b2bPrice, 
    tiers,
    productId,
    onPriceChange,
}: { 
    unitCost: number, 
    b2bPrice: number, 
    tiers: Tier[],
    productId: string,
    onPriceChange: (newPrice: number) => void
}) => {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isUpdatingPrice, setIsUpdatingPrice] = React.useState(false);

    if (unitCost <= 0 || b2bPrice <= 0) return null;

    const tierData = tiers.map((tier) => {
        const discountedPrice = b2bPrice * (1 - (tier.discount || 0) / 100);
        const profit = discountedPrice - unitCost;
        const margin = discountedPrice > 0 ? (profit / discountedPrice) * 100 : 0;
        return { discountedPrice, profit, margin };
    });

    const allTiersProfitable = tierData.every(t => t.profit >= 0);

    const handleApplyPrice = async () => {
        if (!user || !firestore || !productId) return;
        setIsUpdatingPrice(true);
        const productRef = doc(firestore, 'manufacturers', user.uid, 'products', productId);
        try {
            await updateDocumentNonBlocking(productRef, { price: b2bPrice });
            toast({
                title: 'Product Price Updated',
                description: `The base B2B price has been set to KES ${b2bPrice.toLocaleString()}.`
            });
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to update product price.', variant: 'destructive'});
        } finally {
            setIsUpdatingPrice(false);
        }
    };


    return (
        <div className="space-y-2 rounded-md bg-muted p-4">
            <h4 className="text-sm font-semibold">Margin Helper</h4>
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important: Final Pricing</AlertTitle>
                <AlertDescription className="text-xs">
                    The prices calculated here are final for the event. Buyers will be sent directly to checkout at these discounted rates. There is no further negotiation. Set your margins accordingly.
                </AlertDescription>
            </Alert>
            <div className="grid gap-2">
                <Label htmlFor="b2b-price">Product B2B Price (KES)</Label>
                <Input id="b2b-price" type="number" value={b2bPrice} onChange={e => onPriceChange(Number(e.target.value))} />
            </div>
            {tierData.map((tier, index) => {
                if (tiers[index].discount <= 0) return null;
                return (
                    <div key={index} className="space-y-1 rounded-md bg-background/50 p-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Tier {index + 1} ({tiers[index].discount}%)</span>
                            <span className="font-bold">KES {tier.discountedPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                             <span className="text-muted-foreground">Margin</span>
                            <span className={tier.margin >= 0 ? 'text-green-600' : 'text-destructive'}>
                                KES {tier.profit.toFixed(2)} ({tier.margin.toFixed(1)}%)
                            </span>
                        </div>
                    </div>
                )
            })}
             <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full mt-2"
                onClick={handleApplyPrice}
                disabled={!allTiersProfitable || isUpdatingPrice}
                >
                {isUpdatingPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePenLine className="mr-2 h-4 w-4" />}
                Apply New B2B Price
            </Button>
            {!allTiersProfitable && <p className="text-xs text-center text-destructive mt-1">Button disabled because one or more tiers result in a loss.</p>}
        </div>
    )
}

const GrowthPartnerFinder = ({ onSelectPartner, selectedPartner }: { onSelectPartner: (partner: Partner | null) => void, selectedPartner: Partner | null }) => {
    const [open, setOpen] = React.useState(false);
    const [myNetwork] = useLocalStorageState<Partner[]>('my-partner-network', []);
    
    const handleSelect = (partner: Partner) => {
        onSelectPartner(partner);
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                        {selectedPartner ? (
                            <div className="flex items-center gap-2">
                                <Handshake className="h-4 w-4" />
                                {selectedPartner.fullName}
                            </div>
                        ) : (
                            "Select a partner... (Optional)"
                        )}
                    </Button>
                    {selectedPartner && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => onSelectPartner(null)}>Clear</Button>
                    )}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Find a Growth Partner</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-64 overflow-y-auto mt-4">
                    {myNetwork.length > 0 ? myNetwork.map(partner => (
                        <div key={partner.id} onClick={() => handleSelect(partner)} className="p-2 flex items-center gap-3 rounded-md hover:bg-muted cursor-pointer">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={partner.photoURL || `https://i.pravatar.cc/40?u=${partner.id}`} />
                                <AvatarFallback>{partner.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold">{partner.fullName}</p>
                        </div>
                    )) : (
                        <p className="text-center text-sm text-muted-foreground py-8">Your network is empty. Add partners from their profiles.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default function ProposeForgingEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const productsQuery = useMemoFirebase(() => {
      if (!user) return null;
      return query(collection(firestore, `manufacturers/${user.uid}/products`), where('status', '==', 'published'));
  }, [user, firestore]);

  const { data: productsData, isLoading: isLoadingProducts } = useCollection<ProductWithVariants>(productsQuery);
  const productOptions: ComboboxOption[] = React.useMemo(() => {
      if (!productsData) return [];
      return productsData.map(p => ({ value: p.id, label: p.name }));
  }, [productsData]);
  
  // State for the form
  const [selectedProductId, setSelectedProductId] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState<ProductWithVariants | null>(null);
  const [selectedPartner, setSelectedPartner] = React.useState<Partner | null>(null);
  const [commission, setCommission] = React.useState(5);
  const [duration, setDuration] = React.useState(72);
  const [unitCost, setUnitCost] = React.useState(0);
  const [b2bPrice, setB2bPrice] = React.useState(0);
  const [tiers, setTiers] = React.useState<Tier[]>([
    { id: nanoid(), buyers: 10, discount: 10 },
  ]);

  React.useEffect(() => {
      const product = productsData?.find(p => p.id === selectedProductId);
      if (product) {
          setSelectedProduct(product);
          setB2bPrice(product.variants?.[0]?.price || 0);
      } else {
          setSelectedProduct(null);
          setB2bPrice(0);
      }
  }, [selectedProductId, productsData]);

  const handleAddTier = () => {
    setTiers([...tiers, { id: nanoid(), buyers: 0, discount: 0 }]);
  };

  const handleTierChange = (id: string, field: 'buyers' | 'discount', value: number) => {
    const newTiers = tiers.map(t => t.id === id ? {...t, [field]: value} : t);
    setTiers(newTiers);
  };
  
  const handleRemoveTier = (id: string) => {
      setTiers(tiers.filter((t) => t.id !== id));
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
       if (!selectedProductId || !selectedProduct) {
          toast({
              title: "Product Required",
              description: "Please select a product for this event.",
              variant: "destructive"
          });
          return;
      }
      if (!user || !firestore) return;

      setIsSubmitting(true);
      try {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + duration);

        const eventData = {
            id: nanoid(),
            productId: selectedProductId,
            productName: selectedProduct.name,
            productImageUrl: selectedProduct.imageUrl || '',
            sellerId: user.uid,
            sellerName: user.displayName || 'Tradinta Seller',
            partnerId: selectedPartner?.id || null,
            partnerName: selectedPartner?.fullName || null,
            partnerAvatarUrl: selectedPartner?.photoURL || '',
            status: selectedPartner ? 'proposed' : 'active', // Active immediately if no partner
            commissionRate: selectedPartner ? commission : 0,
            tiers: tiers.map(t => ({ buyerCount: t.buyers, discountPercentage: t.discount })),
            currentBuyerCount: 0,
            startTime: selectedPartner ? null : serverTimestamp(), // Starts now if no partner
            endTime: endTime,
            createdAt: serverTimestamp()
        };

        await addDocumentNonBlocking(collection(firestore, 'forgingEvents'), eventData);

        if (selectedPartner) {
            toast({
                title: "Proposal Sent!",
                description: `Your proposal has been sent to ${selectedPartner.fullName}.`
            });
        } else {
             toast({
                title: "Deal is Live!",
                description: 'Your partner-less deal has been created and is now active.'
            });
        }
        
        router.push('/dashboards/seller-centre/foundry');
      } catch(error: any) {
        toast({ title: 'Submission Failed', description: error.message, variant: 'destructive'});
        setIsSubmitting(false);
      }
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
              <Link href="/dashboards/seller-centre/foundry">The Foundry</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Propose Deal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboards/seller-centre/foundry">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Propose a New Deal
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button
            type="submit"
            form="forging-event-form"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {selectedPartner ? 'Send Proposal' : 'Launch Deal'}
          </Button>
        </div>
      </div>
      
      <form id="forging-event-form" onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Core Details</CardTitle>
                    <CardDescription>Select the product and (optionally) a partner for this deal.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                     <div className="grid gap-2">
                        <Label>Product to Promote</Label>
                        <Combobox 
                            options={productOptions} 
                            value={selectedProductId} 
                            onValueChange={setSelectedProductId} 
                            placeholder="Select a product..." 
                            emptyMessage={isLoadingProducts ? 'Loading products...' : 'No published products found.'}
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label>Growth Partner (Optional)</Label>
                        <GrowthPartnerFinder onSelectPartner={setSelectedPartner} selectedPartner={selectedPartner} />
                    </div>
                </CardContent>
             </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Discount Tiers</CardTitle>
                    <CardDescription>Define the buyer thresholds to unlock higher discounts for everyone.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tiers.map((tier, index) => (
                        <div key={tier.id} className="flex items-end gap-2 p-3 border rounded-md relative">
                             <div className="grid gap-1.5 flex-grow">
                                <Label htmlFor={`buyers-${index}`}>If we get</Label>
                                <div className="relative">
                                    <Input id={`buyers-${index}`} type="number" value={tier.buyers || ''} onChange={e => handleTierChange(tier.id, 'buyers', Number(e.target.value))} placeholder="e.g. 10"/>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">buyers</span>
                                </div>
                            </div>
                            <div className="grid gap-1.5 flex-grow">
                                <Label htmlFor={`discount-${index}`}>unlock</Label>
                                <div className="relative">
                                     <Input id={`discount-${index}`} type="number" value={tier.discount || ''} onChange={e => handleTierChange(tier.id, 'discount', Number(e.target.value))} placeholder="e.g. 15" />
                                     <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            {tiers.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 absolute -top-3 -right-3" onClick={() => handleRemoveTier(tier.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddTier}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Tier
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Deal Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="commission" className={!selectedPartner ? "text-muted-foreground" : ""}>Partner Commission (%)</Label>
                        <Input id="commission" type="number" value={commission} onChange={e => setCommission(Number(e.target.value))} disabled={!selectedPartner}/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="duration">Deal Duration (hours)</Label>
                        <Input id="duration" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp />Margin Helper</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="unitCost">Your Unit Cost (KES)</Label>
                        <Input id="unitCost" type="number" placeholder="Enter your cost per item" onChange={e => setUnitCost(Number(e.target.value))} />
                    </div>
                    {selectedProduct && <MarginHelper 
                        unitCost={unitCost} 
                        b2bPrice={b2bPrice}
                        onPriceChange={setB2bPrice}
                        tiers={tiers}
                        productId={selectedProduct.id}
                    />}
                </CardContent>
            </Card>
        </div>
      </form>
    </div>
  );
}
