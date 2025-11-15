
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  Truck,
  MessageSquare,
  Coins,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Instagram,
  Check,
  FileText,
  Eye,
  Loader2,
  Sparkles,
  ShoppingCart,
  Landmark,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { RequestQuoteModal } from '@/components/request-quote-modal';
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, limit, getDocs, doc, collectionGroup, getDoc, serverTimestamp } from 'firebase/firestore';
import { type Manufacturer, type Review, type Product } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ContactManufacturerModal } from '@/components/contact-manufacturer-modal';
import { ProductReviews } from '@/components/product-reviews';
import { nanoid } from 'nanoid';
import { logFeatureUsage } from '@/lib/analytics';
import { ReportModal } from '@/components/report-modal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { WishlistButton } from '@/components/wishlist-button';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import { ProductCard } from '@/components/product-card';
import { useState, useEffect } from 'react';
import { createMarkup } from '@/lib/utils';
import { VerifiedSeal } from '@/components/verified-seal';
import Head from 'next/head';

type Variant = {
    id: string;
    price: number;
    retailPrice?: number;
    stock: number;
    b2cStock?: number;
    sku: string;
    attributes: Record<string, string>;
};

type ProductWithVariants = Product & { 
    variants: Variant[];
    options: string[];
    bannerUrl?: string;
    moq?: number;
    weight?: string;
    dimensions?: string;
    material?: string;
    packagingDetails?: string;
    certifications?: string;
    sku?: string;
    shopId?: string;
    listOnTradintaDirect?: boolean;
};

type ForgingEvent = {
    id: string;
    currentBuyerCount: number;
    endTime: any; // Firestore Timestamp
    tiers: { buyerCount: number; discountPercentage: number }[];
};

export default function ProductDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const shopId = params.shopId as string;
    const slug = params.slug as string;
    const source = searchParams.get('source') || 'direct'; // Get source from URL
    const { user, role } = useUser();
    const firestore = useFirestore();

    const [product, setProduct] = React.useState<ProductWithVariants | null>(null);
    const [manufacturer, setManufacturer] = React.useState<Manufacturer | null>(null);
    const [forgingEvent, setForgingEvent] = React.useState<ForgingEvent | null>(null);
    const [relatedProducts, setRelatedProducts] = React.useState<ProductWithVariants[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isPledging, setIsPledging] = React.useState(false);
    const [userHasPledged, setUserHasPledged] = React.useState(false);
    const [showFullDescription, setShowFullDescription] = React.useState(false);
    
    // --- Variant State ---
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [currentVariant, setCurrentVariant] = useState<Variant | null>(null);

    const { toast } = useToast();
    
    const quotationQuery = useMemoFirebase(() => {
        if (!firestore || !user || !product) return null;
        return query(
            collection(firestore, 'manufacturers', product.manufacturerId, 'quotations'),
            where('buyerId', '==', user.uid),
            where('productId', '==', product.id),
            limit(1)
        );
    }, [firestore, user, product]);

    const { data: existingQuotations } = useCollection(quotationQuery);
    
    const existingQuote = React.useMemo(() => {
        if (existingQuotations && existingQuotations.length > 0) {
            return existingQuotations[0];
        }
        return null;
    }, [existingQuotations]);


    React.useEffect(() => {
        const fetchData = async () => {
            if (!firestore || !shopId || !slug) return;
            setIsLoading(true);

            const manufQuery = query(collection(firestore, 'manufacturers'), where('shopId', '==', shopId), limit(1));
            const manufSnapshot = await getDocs(manufQuery);

            if (manufSnapshot.empty) {
                setManufacturer(null);
                setProduct(null);
                setIsLoading(false);
                return;
            }
            
            const manufacturerDoc = manufSnapshot.docs[0];
            const manufacturerData = { ...manufacturerDoc.data(), id: manufacturerDoc.id } as Manufacturer;
            setManufacturer(manufacturerData);

            const productQuery = query(
                collection(firestore, 'manufacturers', manufacturerData.id, 'products'),
                where('slug', '==', slug),
                limit(1)
            );
            const productSnapshot = await getDocs(productQuery);

            if (productSnapshot.empty) {
                setProduct(null);
            } else {
                const productDoc = productSnapshot.docs[0];
                const productData = { ...productDoc.data(), id: productDoc.id } as ProductWithVariants;
                setProduct(productData);

                if (user && role) {
                    logFeatureUsage({
                        feature: 'product:view',
                        userId: user.uid,
                        userRole: role,
                        metadata: { productId: productDoc.id, productName: productData.name, page: `/products/${shopId}/${slug}` }
                    });
                }
                
                // Initialize variant state
                if (productData.variants && productData.variants.length > 0) {
                    // If no options, set first variant. If options, wait for user selection.
                    if (!productData.options || productData.options.filter(Boolean).length === 0) {
                        setCurrentVariant(productData.variants[0]);
                    } else {
                        setSelectedOptions(productData.variants[0].attributes);
                    }
                }


                const eventQuery = query(
                    collection(firestore, 'forgingEvents'),
                    where('productId', '==', productDoc.id),
                    where('status', '==', 'active'),
                    limit(1)
                );
                const eventSnapshot = await getDocs(eventQuery);
                if (!eventSnapshot.empty) {
                    const eventData = eventSnapshot.docs[0].data() as ForgingEvent;
                    setForgingEvent(eventData);

                    if (user) {
                        const pledgeQuery = query(collection(firestore, 'pledges'), where('buyerId', '==', user.uid), where('forgingEventId', '==', eventData.id), limit(1));
                        const pledgeSnapshot = await getDocs(pledgeQuery);
                        setUserHasPledged(!pledgeSnapshot.empty);
                    }
                }
                
                // Fetch related products from the same category
                if (productData.category) {
                    const rankedData = await getRankedProducts({ userId: user?.uid || null });
                    const related = rankedData.products
                        .filter(p => p.category === productData.category && p.id !== productData.id)
                        .slice(0, 4);
                    setRelatedProducts(related as ProductWithVariants[]);
                }
            }
            
            setIsLoading(false);
        };

        fetchData();
    }, [firestore, shopId, slug, user, role]);
    
    // --- START: New Variant Logic ---
    const handleOptionChange = (optionName: string, value: string) => {
        setSelectedOptions(prev => ({...prev, [optionName]: value}));
    };
    
    useEffect(() => {
        if (!product || !product.variants) return;

        // If there are no options to select, don't try to match variants.
        if (!product.options || product.options.filter(Boolean).length === 0) {
            return;
        }

        const findMatchingVariant = () => {
            return product.variants.find(variant => 
                Object.entries(selectedOptions).every(([key, value]) => variant.attributes[key] === value)
            ) || null;
        }
        
        setCurrentVariant(findMatchingVariant());
    }, [selectedOptions, product]);

    const availableOptions = React.useMemo(() => {
        if (!product?.options || !product?.variants) return {};
        
        const optionsMap: Record<string, Set<string>> = {};
        product.options.forEach(opt => {
            optionsMap[opt] = new Set<string>();
        });

        product.variants.forEach(variant => {
            for (const option of product.options) {
                if (variant.attributes[option]) {
                    optionsMap[option].add(variant.attributes[option]);
                }
            }
        });
        
        const result: Record<string, string[]> = {};
        for (const key in optionsMap) {
            result[key] = Array.from(optionsMap[key]);
        }
        return result;

    }, [product]);
    
    const productForQuote = React.useMemo(() => {
        if (!product) return null;
        if (!currentVariant) return product;
        
        const selectedAttrs = Object.entries(currentVariant.attributes).map(([key, value]) => `${key}: ${value}`).join(', ');

        return {
            ...product,
            name: `${product.name} (${selectedAttrs})`,
            price: currentVariant.price,
            stock: currentVariant.stock,
            sku: currentVariant.sku,
        }
    }, [product, currentVariant]);
    // --- END: New Variant Logic ---
    
    const [mainImage, setMainImage] = React.useState<string | undefined>(product?.bannerUrl || product?.imageUrl);

    React.useEffect(() => {
        if(product && !mainImage) {
            setMainImage(product.bannerUrl || product.imageUrl);
        }
    }, [product, mainImage]);
    
    const productUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `Check out this product on Tradinta: ${product?.name}`;
    
    const handlePledge = async () => {
        if (!user || !firestore || !forgingEvent) {
            toast({ title: 'You must be logged in to pledge.', variant: 'destructive'});
            return;
        }
        setIsPledging(true);
        try {
            await addDocumentNonBlocking(collection(firestore, 'pledges'), {
                id: nanoid(),
                forgingEventId: forgingEvent.id,
                buyerId: user.uid,
                pledgedAt: serverTimestamp(),
            });
            toast({ title: "You've Pledged!", description: "You will be notified when the event ends."});
            setUserHasPledged(true);
        } catch (error: any) {
             toast({ title: 'Pledge failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsPledging(false);
        }
    };

    // SEO TITLE
    useEffect(() => {
        if (product && manufacturer) {
            document.title = `${product.name} by ${manufacturer.shopName} | Tradinta`;
        }
    }, [product, manufacturer]);


    if (isLoading) {
        return (
             <div className="container mx-auto py-12">
                 <div className="grid lg:grid-cols-3 gap-12">
                     <div className="lg:col-span-1">
                         <Skeleton className="aspect-square w-full mb-4 rounded-lg" />
                         <div className="grid grid-cols-4 gap-2">
                             <Skeleton className="aspect-square rounded-md" />
                             <Skeleton className="aspect-square rounded-md" />
                             <Skeleton className="aspect-square rounded-md" />
                             <Skeleton className="aspect-square rounded-md" />
                         </div>
                     </div>
                     <div className="lg:col-span-2 space-y-4">
                         <Skeleton className="h-10 w-3/4" />
                         <Skeleton className="h-6 w-1/2" />
                         <Skeleton className="h-24 w-full" />
                         <Skeleton className="h-24 w-full" />
                     </div>
                 </div>
             </div>
        )
    }

    if (!product || !manufacturer || !productForQuote) {
        return (
            <div className="container mx-auto py-12 text-center">
                <h1 className="text-2xl font-bold">Product Not Found</h1>
                <p className="text-muted-foreground mt-2">The product you are looking for does not exist or may have been moved.</p>
                <Button asChild className="mt-4"><Link href="/products">Back to Products</Link></Button>
            </div>
        );
    }
  
  const images = [
    product.bannerUrl,
    product.imageUrl,
    ...(product.otherImageUrls || [])
  ].filter(Boolean) as string[];
  
  const descriptionNeedsTruncation = product.description.length > 250;

  const isB2C = product.listOnTradintaDirect;
  
  const getPriceDisplay = () => {
    const hasOptions = product.options && product.options.filter(Boolean).length > 0;
    
    if (currentVariant) {
      const price = isB2C ? currentVariant.retailPrice : currentVariant.price;
      return `KES ${price?.toLocaleString()}`;
    }
    
    // If no variants but a base price exists on the product object
    if (!hasOptions && product.price > 0) {
      return `KES ${product.price.toLocaleString()}`;
    }
    
    return 'Select options to see price';
  };


  return (
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
              <Link href="/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/products?category=${product.category}`}>{product.category}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <div className="relative aspect-square w-full mb-4 rounded-lg overflow-hidden">
            <Image
              src={mainImage || product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, index) => (
              <div
                key={index}
                className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setMainImage(img)}
              >
                <Image
                  src={img}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <h1 className="text-3xl font-bold font-headline mb-2">{product.name}</h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount || 0} reviews)</span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            {manufacturer.isVerified && <VerifiedSeal />}
          </div>
          <div className="prose prose-sm max-w-none text-muted-foreground mb-4" dangerouslySetInnerHTML={createMarkup(product.description)} />
          
          {/* --- START: Variant Selection --- */}
            {product.options && product.options.filter(Boolean).length > 0 && (
                <div className="space-y-4 mb-6">
                    {product.options.filter(Boolean).map(optionName => (
                        <div key={optionName}>
                            <Label className="font-semibold">{optionName}</Label>
                            <RadioGroup
                                value={selectedOptions[optionName]}
                                onValueChange={(value) => handleOptionChange(optionName, value)}
                                className="flex items-center gap-2 mt-2"
                            >
                                {availableOptions[optionName]?.map(value => (
                                    <div key={value}>
                                        <RadioGroupItem value={value} id={`${optionName}-${value}`} className="sr-only" />
                                        <Label
                                            htmlFor={`${optionName}-${value}`}
                                            className="px-4 py-2 border rounded-md cursor-pointer text-sm hover:bg-accent data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                                        >
                                            {value}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
            )}
          {/* --- END: Variant Selection --- */}
          
          <Card className="bg-muted/50">
              <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                          <p className="text-muted-foreground">SKU</p>
                          <p className="font-semibold">{currentVariant?.sku || product.sku || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-muted-foreground">Category</p>
                          <p className="font-semibold text-primary hover:underline">
                              <Link href={`/products?category=${product.category}`}>{product.category}</Link>
                          </p>
                      </div>
                      <div>
                          <p className="text-muted-foreground">Min. Order (MOQ)</p>
                          <p className="font-semibold">{product.moq || 1} Units</p>
                      </div>
                      <div>
                          <p className="text-muted-foreground">Lead Time</p>
                          <p className="font-semibold">{manufacturer.leadTime || 'New Seller'}</p>
                      </div>
                  </div>
              </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Card className="p-6">
                <p className="text-sm text-muted-foreground">B2B Price</p>
                <p className="text-3xl font-bold mb-4">{getPriceDisplay()}</p>
                
                <div className="space-y-3">
                  {isB2C ? (
                      <WishlistButton productId={product.id} manufacturerId={product.manufacturerId} />
                  ) : forgingEvent ? (
                      <Button size="lg" className="w-full" onClick={handlePledge} disabled={isPledging || userHasPledged}>
                        {isPledging ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                        {userHasPledged ? "You've Pledged!" : "Pledge to Purchase"}
                      </Button>
                  ) : (
                    <RequestQuoteModal product={productForQuote} source={source}>
                        <Button size="lg" className="w-full" disabled={!!existingQuote || !productForQuote.price} onClick={() => user && role && logFeatureUsage({feature: 'product:request_quote', userId: user.uid, userRole: role, metadata: { productId: product.id, page: `/products/${shopId}/${slug}` }})}>
                            Request Quotation
                        </Button>
                    </RequestQuoteModal>
                  )}
                    {existingQuote && !isB2C && (
                        <p className="text-xs text-center text-muted-foreground">
                            You have an existing quotation for this product.{' '}
                            <Link href={`/dashboards/buyer/quotations/${existingQuote.id}`} className="font-semibold text-primary hover:underline flex items-center justify-center gap-1">
                                <Eye className="h-4 w-4" /> View Quotation
                            </Link>
                        </p>
                    )}

                    <ContactManufacturerModal product={product} manufacturer={manufacturer}>
                        <Button size="lg" variant="outline" className="w-full">
                            <MessageSquare className="mr-2 h-5 w-5"/>
                            Contact Manufacturer
                        </Button>
                    </ContactManufacturerModal>
                </div>

                <div className="flex items-center justify-center">
                    <WishlistButton productId={product.id} manufacturerId={product.manufacturerId} />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                                <Share2 className="mr-1 h-4 w-4"/> Share
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1">
                            <div className="flex">
                                <Button size="icon" variant="ghost" className="h-9 w-9" asChild>
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`} target="_blank" rel="noopener noreferrer"><Facebook className="h-5 w-5 text-[#1877F2]" /></a>
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9" asChild>
                                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5 text-[#1DA1F2]" /></a>
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9" asChild>
                                    <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + productUrl)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-5 w-5 text-[#25D366]" /></a>
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9" asChild>
                                    <a href={`https://www.instagram.com`} target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 text-[#E4405F]" /></a>
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <ReportModal reportType="Product" referenceId={product.id} productName={product.name}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <FileText className="mr-1 h-4 w-4"/> Report
                        </Button>
                    </ReportModal>
                </div>
                <Separator className="my-4"/>

                <div className="space-y-2 text-center text-sm">
                    <p className="font-semibold">Accepted Payments</p>
                    <div className="flex justify-center items-center gap-4">
                      <Image src="https://i.postimg.cc/kGNgLwSY/credit-card.png" alt="Credit Card" width={32} height={32} title="Credit/Debit Card" />
                      <Image src="https://i.postimg.cc/qRTfWrG6/image-Photoroom.png" alt="M-Pesa" width={48} height={48} title="M-Pesa" />
                      <Landmark className="w-7 h-7 text-muted-foreground" title="Bank Transfer" />
                      <Image src="https://i.postimg.cc/xjZhmYGD/image-Photoroom-1-Photoroom.png" alt="TradePay" width={32} height={32} title="TradePay" />
                    </div>
                </div>
                {manufacturer.isVerified && (
                  <div className="mt-4 p-3 bg-accent/20 rounded-md text-center">
                      <p className="flex items-center justify-center gap-2 text-sm font-semibold text-primary">
                          <Coins className="h-5 w-5" />
                          Earn TradPoints on this purchase
                      </p>
                  </div>
                )}
            </Card>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-12 mt-12">
        <div className="lg:col-span-2">
            <Tabs defaultValue="description">
                <TabsList>
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="specs">Specifications</TabsTrigger>
                    <TabsTrigger value="packaging">Packaging</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="prose prose-sm max-w-none text-muted-foreground mt-4">
                    <div dangerouslySetInnerHTML={createMarkup(product.description)} />
                </TabsContent>
                <TabsContent value="specs" className="mt-4">
                    <Table>
                        <TableBody>
                            <TableRow><TableCell className="font-medium text-muted-foreground">Weight</TableCell><TableCell>{product.weight || 'N/A'}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium text-muted-foreground">Dimensions</TableCell><TableCell>{product.dimensions || 'N/A'}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium text-muted-foreground">Material</TableCell><TableCell>{product.material || 'N/A'}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium text-muted-foreground">Standards</TableCell><TableCell>{product.certifications || 'N/A'}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </TabsContent>
                <TabsContent value="packaging" className="mt-4 text-sm text-muted-foreground">
                    <p>{product.packagingDetails || 'Standard packaging information not available.'}</p>
                </TabsContent>
                <TabsContent value="reviews" className="mt-4 space-y-6">
                    <ProductReviews product={product} />
                </TabsContent>
            </Tabs>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>About the Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <Image src={manufacturer.logoUrl || 'https://i.postimg.cc/j283ydft/image.png'} alt={manufacturer.shopName || ''} width={64} height={64} className="rounded-full" />
                        <div>
                            <h4 className="font-bold">{manufacturer.shopName}</h4>
                            <p className="text-sm text-muted-foreground">{manufacturer.location}</p>
                            <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/> {manufacturer.rating} Seller Rating
                            </div>
                        </div>
                    </div>
                    <Button asChild className="w-full">
                        <Link href={`/manufacturer/${manufacturer.slug}?source=product_page`}>View Shop</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold font-headline mb-6">You May Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {relatedProducts.length > 0 ? (
            relatedProducts.map((p) => <ProductCard key={p.id} product={p as any} context="b2b" source="related_products" />)
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-8">
                <p>No other products found in this category.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
