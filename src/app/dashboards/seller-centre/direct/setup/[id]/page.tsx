'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Save, ShoppingBag, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Variant = {
  id: string;
  price: number; // B2B price
  retailPrice?: number;
  stock: number;
  b2cStock?: number;
  attributes: Record<string, string>;
};

type Product = {
  name: string;
  imageUrl?: string;
  variants: Variant[];
  tradintaDirectStatus?: 'not_listed' | 'pending_setup' | 'live' | 'paused';
};

export default function B2CSetupPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = React.useState(false);
  
  const productDocRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore || !productId) return null;
    return doc(firestore, 'manufacturers', user.uid, 'products', productId);
  }, [firestore, user, productId]);

  const { data: product, isLoading } = useDoc<Product>(productDocRef);

  const [variants, setVariants] = React.useState<Variant[]>([]);
  const [isLive, setIsLive] = React.useState(false);

  React.useEffect(() => {
    if (product) {
      setVariants(product.variants || []);
      setIsLive(product.tradintaDirectStatus === 'live');
    }
  }, [product]);

  const handleVariantChange = (variantId: string, field: 'retailPrice' | 'b2cStock', value: string) => {
    setVariants(prev => prev.map(v =>
      v.id === variantId ? { ...v, [field]: Number(value) } : v
    ));
  };
  
  const handleSaveChanges = async () => {
    if (!productDocRef) return;

    // Validation
    for (const variant of variants) {
        if (!variant.retailPrice || variant.retailPrice <= 0) {
            toast({ title: "Validation Error", description: "All variants must have a valid Retail Price.", variant: "destructive"});
            return;
        }
         if (variant.b2cStock === undefined || variant.b2cStock < 0) {
            toast({ title: "Validation Error", description: "B2C Stock cannot be negative.", variant: "destructive"});
            return;
        }
         if (variant.b2cStock > variant.stock) {
            toast({ title: "Validation Error", description: `B2C stock for variant cannot exceed total stock of ${variant.stock}.`, variant: "destructive"});
            return;
        }
    }

    setIsSaving(true);
    try {
        const isFirstTimeSetup = product?.tradintaDirectStatus === 'pending_setup';

        await updateDoc(productDocRef, {
            variants: variants,
            tradintaDirectStatus: 'live',
            updatedAt: serverTimestamp(),
        });

        if (isFirstTimeSetup) {
            toast({
                title: 'Product Live on Tradinta Direct!',
                description: `${product?.name} is now available for direct purchase.`
            });
        } else {
            toast({
                title: 'Changes Saved',
                description: `Your B2C settings for ${product?.name} have been updated.`
            });
        }

        router.push('/dashboards/seller-centre/direct');

    } catch (error: any) {
        toast({ title: 'Error', description: `Failed to save changes: ${error.message}`, variant: 'destructive'});
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleDelist = async () => {
      // Future logic to pause or remove from Tradinta Direct
      toast({ title: 'Functionality Coming Soon', description: 'The ability to pause or delist items will be added in a future update.'})
  }

  if (isLoading || !product) {
    return <Skeleton className="h-96 w-full" />;
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
              <Link href="/dashboards/seller-centre/direct">Tradinta Direct</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isLive ? "Manage B2C Listing" : "B2C Setup"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboards/seller-centre/direct">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="relative w-12 h-12 rounded-md overflow-hidden">
            <Image src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'} alt={product.name} fill className="object-cover" />
        </div>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {product.name}
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          {isLive && (
             <Button variant="destructive" onClick={handleDelist}>
                Delist from Tradinta Direct
              </Button>
          )}
          <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isLive ? 'Save Changes' : 'Save and Go Live'}
          </Button>
        </div>
      </div>
      
       <Alert>
          <ShoppingBag className="h-4 w-4" />
          <AlertTitle>B2C Listing Setup</AlertTitle>
          <AlertDescription>
            Set the consumer-facing retail price and allocate specific inventory for Tradinta Direct. This stock is separate from your main B2B inventory.
          </AlertDescription>
        </Alert>
        
      <Card>
        <CardHeader>
            <CardTitle>B2C Pricing & Inventory</CardTitle>
            <CardDescription>Set the retail price and dedicated stock for each product variant you want to sell on Tradinta Direct.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {variants.map(variant => (
                <div key={variant.id} className="p-4 border rounded-lg bg-muted/20">
                    <p className="font-semibold">{Object.values(variant.attributes).join(' / ') || 'Default Variant'}</p>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor={`b2b-price-${variant.id}`} className="text-xs">B2B Price (Reference)</Label>
                            <Input id={`b2b-price-${variant.id}`} value={variant.price.toLocaleString()} disabled className="bg-muted/50"/>
                        </div>
                         <div className="grid gap-1.5">
                            <Label htmlFor={`retail-price-${variant.id}`} className="text-xs flex items-center gap-1"><Star className="w-3 h-3 text-primary"/>Retail Price (RRP)</Label>
                            <Input id={`retail-price-${variant.id}`} type="number" placeholder="e.g. 1200" value={variant.retailPrice || ''} onChange={e => handleVariantChange(variant.id, 'retailPrice', e.target.value)} />
                        </div>
                         <div className="grid gap-1.5">
                            <Label htmlFor={`b2c-stock-${variant.id}`} className="text-xs">Tradinta Direct Stock</Label>
                            <Input id={`b2c-stock-${variant.id}`} type="number" placeholder={`Max: ${variant.stock}`} value={variant.b2cStock || ''} onChange={e => handleVariantChange(variant.id, 'b2cStock', e.target.value)} max={variant.stock}/>
                        </div>
                    </div>
                </div>
            ))}
        </CardContent>
      </Card>
      
       <div className="flex justify-end items-center gap-2">
           {isLive && (
             <Button variant="destructive" onClick={handleDelist}>
                Delist from Tradinta Direct
              </Button>
          )}
          <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isLive ? 'Save Changes' : 'Save and Go Live'}
          </Button>
        </div>
    </div>
  );
}
