'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  Truck,
  MessageSquare,
  Coins,
  Share2,
  ShoppingCart,
  Minus,
  Plus,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, limit, getDocs, doc, collectionGroup, getDoc, serverTimestamp, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import { type Manufacturer, type Review, type Product } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductReviews } from '@/components/product-reviews';
import { WishlistButton } from '@/components/wishlist-button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { nanoid } from 'nanoid';
import { logFeatureUsage } from '@/lib/analytics';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Head from 'next/head';

type Variant = {
    id: string;
    price: number;
    retailPrice?: number;
    stock: number;
    b2cStock?: number;
    attributes: Record<string, string>;
};

type ProductWithVariants = Product & { 
    variants: Variant[];
    options: string[];
    bannerUrl?: string;
    moq?: number;
};


export default function DirectProductPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { user, role } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [product, setProduct] = React.useState<ProductWithVariants | null>(null);
    const [manufacturer, setManufacturer] = React.useState<Manufacturer | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [quantity, setQuantity] = React.useState(1);
    
    // --- Page View Tracking ---
    React.useEffect(() => {
        if (product && user && role) {
            logFeatureUsage({
                feature: 'product:view:direct',
                userId: user.uid,
                userRole: role,
                metadata: { productId: product.id, productName: product.name }
            });
        }
    }, [product, user, role]);

    React.useEffect(() => {
        if (!firestore || !slug) return;
        
        const fetchProduct = async () => {
            setIsLoading(true);
            const productQuery = query(
                collectionGroup(firestore, 'products'),
                where('slug', '==', slug),
                where('listOnTradintaDirect', '==', true),
                where('status', '==', 'published'),
                limit(1)
            );
            
            const productSnapshot = await getDocs(productQuery);
            if(productSnapshot.empty) {
                setProduct(null);
                setIsLoading(false);
                return;
            }
            
            const productDoc = productSnapshot.docs[0];
            const productData = { id: productDoc.id, ...productDoc.data() } as ProductWithVariants;
            setProduct(productData);

            if (productData.manufacturerId) {
                const manufDoc = await getDoc(doc(firestore, 'manufacturers', productData.manufacturerId));
                if (manufDoc.exists()) {
                    setManufacturer(manufDoc.data() as Manufacturer);
                }
            }
            setIsLoading(false);
        };

        fetchProduct();
    }, [firestore, slug]);
    
    const displayVariant = product?.variants?.[0];
    const retailPrice = displayVariant?.retailPrice || displayVariant?.price || 0;
    const b2bPrice = displayVariant?.price || 0;
    const stock = displayVariant?.b2cStock || 0;
    const moq = product?.moq || Infinity;

    const totalPrice = React.useMemo(() => retailPrice * quantity, [retailPrice, quantity]);
    
    const savingsPercentage = React.useMemo(() => {
        if (retailPrice > 0 && b2bPrice > 0 && retailPrice > b2bPrice) {
            return Math.round(((retailPrice - b2bPrice) / retailPrice) * 100);
        }
        return 0;
    }, [retailPrice, b2bPrice]);
    
    const showMoqIncentive = quantity >= moq * 0.9 && moq > 1 && savingsPercentage > 0;
    
    const createOrderAndCheckout = async () => {
        if (!user || !firestore || !product || !displayVariant) {
             toast({ title: "Please log in to purchase.", variant: "destructive" });
             return;
        }

        try {
            // 1. Calculate fees and total
            const subtotal = retailPrice * quantity;
            const platformFee = subtotal * 0.012;
            const processingFee = subtotal * 0.02;
            const total = subtotal + platformFee + processingFee;

            // 2. Create the order document
            const orderRef = doc(collection(firestore, 'orders'));
            const orderData = {
                id: orderRef.id,
                buyerId: user.uid,
                buyerName: user.displayName || 'Tradinta Buyer',
                sellerId: 'tradinta-direct', 
                sellerName: 'Tradinta Direct',
                orderDate: serverTimestamp(),
                subtotal: subtotal,
                platformFee: platformFee,
                processingFee: processingFee,
                totalAmount: total,
                status: 'Pending Payment', 
                items: [{
                    productId: product.id,
                    productName: product.name,
                    shopId: (product as any).shopId || product.manufacturerId,
                    quantity: quantity,
                    unitPrice: retailPrice,
                    imageUrl: product.imageUrl,
                }],
                isTradintaDirect: true,
            };
            await setDoc(orderRef, orderData);

            return orderRef.id;

        } catch (error: any) {
             toast({ title: "Checkout Error", description: `Could not create order: ${error.message}`, variant: 'destructive'});
             return null;
        }
    };
    
    const handleAddToCart = async () => {
        if (!user || !firestore || !product) {
            toast({ title: "Please log in", description: "You must be logged in to add items to your cart.", variant: "destructive" });
            return;
        }
        
        try {
            const cartItemRef = doc(firestore, 'users', user.uid, 'cart', product.id);
            await setDoc(cartItemRef, { 
                productId: product.id, 
                quantity: quantity,
                addedAt: serverTimestamp() 
            }, { merge: true });
            toast({ title: "Added to Cart!", description: `${quantity} x ${product.name} has been added to your cart.` });
        } catch (error: any) {
            toast({ title: "Error", description: `Could not add to cart: ${error.message}`, variant: "destructive" });
        }
    };

    const handleBuyNow = async () => {
        const orderId = await createOrderAndCheckout();
        if (orderId) {
            // Clear cart if the same item is in it, then redirect
            if (user && firestore && product) {
                 const cartItemRef = doc(firestore, 'users', user.uid, 'cart', product.id);
                 await deleteDoc(cartItemRef).catch(() => {}); // Ignore error if it doesn't exist
            }
            router.push(`/checkout/${orderId}`);
        }
    };
    
    if (isLoading) {
        return (
            <div className="container mx-auto py-12">
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!product || !manufacturer) {
        return notFound();
    }
    
    // --- SEO & Structured Data ---
    const pageTitle = `${product.name} (Direct) by ${manufacturer.shopName} | Tradinta`;
    const metaDescription = `Buy ${product.name} directly from Tradinta. ${product.description.substring(0, 120)}...`;
    const canonicalUrl = `https://www.tradinta.com/direct/${slug}`;

    const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.imageUrl,
        description: metaDescription,
        sku: displayVariant?.sku || product.sku,
        brand: {
            '@type': 'Brand',
            name: manufacturer.shopName,
        },
        offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            priceCurrency: 'KES',
            price: retailPrice,
            availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: 'Tradinta Direct',
            },
        },
        aggregateRating: product.reviewCount > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
        } : undefined
    };


  return (
    <>
    <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {manufacturer.logoUrl && <link rel="icon" href={manufacturer.logoUrl} type="image/png" sizes="any" />}
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={product.imageUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="product" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    </Head>
    <div className="container mx-auto py-12">
       <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/products?tab=direct">Tradinta Direct</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
           <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
            <div className="relative aspect-square w-full mb-4 rounded-lg overflow-hidden bg-muted">
                <Image src={product.bannerUrl || product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'} alt={product.name} fill className="object-contain" />
                 <Badge className="absolute top-3 left-3 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Tradinta Direct</Badge>
            </div>
        </div>
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 text-sm mb-4">
                <span>Sold by <Link href={`/manufacturer/${manufacturer.slug}`} className="font-semibold text-primary hover:underline">{manufacturer.shopName}</Link></span>
                 {manufacturer.isVerified && <ShieldCheck className="h-4 w-4 text-green-500" />}
            </div>
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                </div>
                 <span className="text-sm text-muted-foreground">({product.reviewCount || 0} reviews)</span>
            </div>
            
            <p className="text-4xl font-bold mb-6">KES {totalPrice.toLocaleString()}</p>
            
            <p className="text-muted-foreground prose prose-sm max-w-none mb-6 line-clamp-3">{product.description}</p>
            
            <div className="flex items-center gap-4 mb-6">
                 <Label htmlFor="quantity" className="font-semibold">Quantity:</Label>
                 <div className="flex items-center border rounded-md">
                     <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(q => Math.max(1, q-1))}><Minus className="w-4 h-4"/></Button>
                     <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-16 h-9 text-center border-0 focus-visible:ring-0" />
                     <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(q => q+1)}><Plus className="w-4 h-4"/></Button>
                 </div>
                 <p className="text-sm text-muted-foreground">{stock > 0 ? `${stock} available` : 'Out of Stock'}</p>
            </div>

            {showMoqIncentive && (
                <Alert className="mb-6 bg-primary/10 border-primary/20">
                    <Zap className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold">Bulk Discount Opportunity!</AlertTitle>
                    <AlertDescription>
                        Buy {moq} units or more directly from the manufacturer and save up to {savingsPercentage}% per item!
                        <Button asChild variant="link" className="p-0 h-auto ml-1 text-primary"><Link href={`/products/${(product as any).shopId}/${product.slug}`}>View B2B Offer <ArrowRight className="w-4 h-4 ml-1"/></Link></Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={stock === 0} variant="outline">
                    <ShoppingCart className="mr-2 h-5 w-5"/> {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button size="lg" className="w-full" onClick={handleBuyNow} disabled={stock === 0}>
                    <Zap className="mr-2 h-5 w-5"/> {stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </Button>
            </div>

             <Separator className="my-6" />

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    <span>Fulfilled by Tradinta</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    <span>Earn TradPoints</span>
                </div>
                 <WishlistButton productId={product.id} manufacturerId={product.manufacturerId} />
            </div>
        </div>
      </div>
      <div className="mt-16">
            <Tabs defaultValue="description">
                <TabsList>
                    <TabsTrigger value="description">Full Description</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="prose prose-sm max-w-none text-muted-foreground mt-4">
                    <p>{product.description}</p>
                </TabsContent>
                <TabsContent value="reviews" className="mt-4">
                    <ProductReviews product={product} />
                </TabsContent>
            </Tabs>
      </div>
    </div>
    </>
  );
}
