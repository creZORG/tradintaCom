
'use client';

import * as React from 'react';
import { ProductService } from '@/services';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, ShieldCheck, Check, X, ServerCrash, TrendingUp, ShoppingCart, Eye, Building, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { RequestQuoteModal } from '@/components/request-quote-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { VerifiedSeal } from '@/components/verified-seal';
import { useProductData } from '@/hooks/use-product-data';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useUser } from '@/firebase';
import { logFeatureUsage } from '@/lib/analytics';

type Product = Awaited<ReturnType<typeof ProductService.getProductsByIds>>[0];

const SpecRow = ({ label, products, dataKey }: { label: string; products: Product[]; dataKey: keyof Product | string }) => {
    // A helper function to safely get a nested property
    const getSpec = (product: Product, key: string) => {
        const keys = key.split('.');
        let value: any = product;
        for (const k of keys) {
            if (value === null || typeof value !== 'object') return 'N/A';
            value = value[k];
        }
        
        if (typeof value === 'boolean') {
            return value ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-destructive" />;
        }
        
        return value || 'N/A';
    }

    return (
        <TableRow>
            <TableHead className="font-semibold">{label}</TableHead>
            {products.map(p => (
                <TableCell key={p.id}>
                    {getSpec(p, dataKey as string)}
                </TableCell>
            ))}
        </TableRow>
    );
};


export default function ComparePage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const ids = searchParams.ids ? searchParams.ids.split(',').filter(Boolean) : [];
  const { products, notFoundIds, isLoading } = useProductData(ids);
  const { user, role } = useUser();

  React.useEffect(() => {
    if (user && role && products.length > 0) {
      logFeatureUsage({
        feature: 'compare:view',
        userId: user.uid,
        userRole: role,
        metadata: {
          productIds: products.map(p => p.id),
          count: products.length
        }
      });
    }
  }, [user, role, products]);

  const handleQuoteClick = (productId: string) => {
    if (user && role) {
      logFeatureUsage({
        feature: 'compare:request_quote',
        userId: user.uid,
        userRole: role,
        metadata: {
          productId: productId
        }
      });
    }
  };


  if (isLoading) {
    // Optional: Add a skeleton loader for better UX
    return (
        <div className="container mx-auto py-12">
            <div className="text-center mb-12">
                <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mt-2"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
    );
  }

  if (ids.length === 0) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold">Nothing to Compare</h1>
        <p className="text-muted-foreground mt-2">
          Please select at least one product to start a comparison.
        </p>
        <Button asChild className="mt-4">
            <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
        <Breadcrumb className="mb-8">
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
                    <BreadcrumbPage>Compare</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline">Compare Products</h1>
            <p className="text-muted-foreground mt-2">Side-by-side comparison of your selected items.</p>
        </div>
        
        {notFoundIds.length > 0 && (
            <Alert variant="destructive" className="mb-8 max-w-4xl mx-auto">
                <ServerCrash className="h-4 w-4" />
                <AlertTitle>Some Items Could Not Be Found</AlertTitle>
                <AlertDescription>
                    We were unable to load the following product IDs:
                    <ul className="list-disc list-inside mt-2 font-mono text-xs">
                        {notFoundIds.map(id => <li key={id}>{id}</li>)}
                    </ul>
                </AlertDescription>
            </Alert>
        )}

        {products.length > 0 ? (
            <div className="space-y-8">
                <Table className="border rounded-lg">
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Feature</TableHead>
                        {products.map(product => (
                        <TableHead key={product.id} className="w-1/4">
                            <Card className="border-0 shadow-none">
                            <CardContent className="p-2 flex flex-col items-center gap-2">
                                <div className="relative w-full aspect-square">
                                <Image src={product.imageUrl || 'https://placehold.co/200x200'} alt={product.name} fill className="object-cover rounded-md" />
                                </div>
                                <Link href={`/products/${(product as any).shopId}/${product.slug}`} className="font-bold text-center hover:text-primary text-sm leading-tight h-10">
                                    {product.name}
                                </Link>
                            </CardContent>
                            </Card>
                        </TableHead>
                        ))}
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Price & Rating */}
                        <TableRow>
                            <TableHead className="font-semibold">Overview</TableHead>
                            {products.map(p => (
                                <TableCell key={p.id}>
                                    <p className="font-bold text-lg">KES {(p.variants?.[0]?.price || 0).toLocaleString()}</p>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="font-semibold">{p.rating?.toFixed(1) || 'N/A'}</span>
                                        <span className="text-xs text-muted-foreground">({p.reviewCount || 0})</span>
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                        {/* New Metrics */}
                         <TableRow>
                            <TableHead className="font-semibold">Performance</TableHead>
                            {products.map(p => (
                                <TableCell key={p.id} className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">TradRank™ Score</p>
                                            <p className="font-bold">{(p as any).tradRank?.toFixed(0) || 'N/A'}</p>
                                        </div>
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                        
                        {/* Dynamic Specs */}
                        <SpecRow label="MOQ" products={products} dataKey="moq" />
                        <SpecRow label="Lead Time" products={products} dataKey="leadTime" />
                        <SpecRow label="Material" products={products} dataKey="material" />
                        <SpecRow label="Certifications" products={products} dataKey="certifications" />

                        {/* Action Buttons */}
                        <TableRow>
                            <TableHead></TableHead>
                            {products.map(p => (
                                <TableCell key={p.id} className="text-center space-y-2">
                                    <RequestQuoteModal product={p as any}>
                                        <Button size="sm" className="w-full" onClick={() => handleQuoteClick(p.id)}>Request Quote</Button>
                                    </RequestQuoteModal>
                                     <Button size="sm" variant="outline" className="w-full" asChild>
                                        <Link href={`/products/${(p as any).shopId}/${p.slug}?source=compare`}>
                                            <Eye className="mr-2"/> View Info
                                        </Link>
                                    </Button>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>

                <Accordion type="single" collapsible>
                    <AccordionItem value="seller-info">
                        <AccordionTrigger className="text-xl font-bold font-headline">Supplier Information</AccordionTrigger>
                        <AccordionContent>
                             <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableHead className="font-semibold w-[200px]">Shop Name</TableHead>
                                        {products.map(p => <TableCell key={p.id}><Link href={`/manufacturer/${(p as any).manufacturerSlug}`} className="hover:underline text-primary">{(p as any).manufacturerName}</Link></TableCell>)}
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="font-semibold">Verification</TableHead>
                                        {products.map(p => <TableCell key={p.id}>{(p as any).isVerified ? <VerifiedSeal /> : <span className="text-muted-foreground">Not Verified</span>}</TableCell>)}
                                    </TableRow>
                                     <TableRow>
                                        <TableHead className="font-semibold">Location</TableHead>
                                        {products.map(p => <TableCell key={p.id}>{(p as any).manufacturerLocation}</TableCell>)}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        ) : (
            <div className="text-center py-16 bg-muted/50 rounded-lg">
                <h2 className="text-xl font-semibold">No products to compare.</h2>
                <p className="text-muted-foreground mt-2">Try adding some products to your comparison list from the main products page.</p>
                <Button asChild className="mt-4">
                    <Link href="/products">Browse Products</Link>
                </Button>
            </div>
        )}
    </div>
  );
}
