
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, Eye, Clock, Package, Hammer, ShoppingCart, Layers } from 'lucide-react';
import { RequestQuoteModal } from '@/components/request-quote-modal';
import type { Product } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Checkbox } from './ui/checkbox';
import { useCompareStore } from '@/hooks/use-compare-store';
import { VerifiedSeal } from './verified-seal';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';


type ProductWithShopId = Product & {
  shopId: string;
  slug: string;
  manufacturerName?: string;
  manufacturerLocation?: string;
  leadTime?: string;
  moq?: number;
  variants: { price: number, retailPrice?: number, b2cStock?: number }[];
  isVerified?: boolean;
  isSponsored?: boolean;
  isForging?: boolean;
  listOnTradintaDirect?: boolean;
  tradintaDirectStatus?: 'not_listed' | 'pending_setup' | 'live' | 'paused';
  imageHint?: string;
  bannerUrl?: string;
  otherImageUrls?: string[];
};

interface ProductCardProps {
    product: ProductWithShopId;
    context: 'b2b' | 'b2c';
    source: string; // New prop for tracking
}

export function ProductCard({ product, context, source }: ProductCardProps) {
    const { items: compareItems, toggleItem } = useCompareStore();
    const isB2CView = context === 'b2c';
    const price = isB2CView ? (product.variants?.[0]?.retailPrice ?? 0) : (product.variants?.[0]?.price ?? 0);
    const stock = isB2CView ? (product.variants?.[0]?.b2cStock ?? 0) : product.stock;
    
    // If it's a B2C card and the price isn't set, don't render it at all.
    if (isB2CView && price <= 0) {
        return null;
    }

    const baseHref = isB2CView ? `/direct/${product.slug}` : `/products/${product.shopId}/${product.slug}`;
    const href = `${baseHref}?source=${source}`;
    const isComparing = compareItems.some(item => item.id === product.id);
    
    const B2CCard = () => (
      <Link href={href} className="block group">
        <Card className="overflow-hidden flex flex-col h-full rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="relative w-full aspect-square">
                <Image
                    src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={product.imageHint}
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Badge className="absolute top-2 left-2 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3"/> Direct
                </Badge>
                 <div className="absolute bottom-2 right-2 bg-background/80 text-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                    <Eye className="w-4 h-4" />
                </div>
            </div>
            <div className="p-4 flex-grow flex flex-col bg-background">
                <h3 className="font-semibold leading-tight h-10 line-clamp-2 text-sm text-foreground">
                  {product.name}
                </h3>
                 <p className="text-xs text-muted-foreground mt-1">by {product.manufacturerName}</p>
                <div className="flex-grow mt-2">
                    <p className="text-lg font-bold text-foreground">
                        KES {price.toLocaleString()}
                    </p>
                    {stock > 0 && stock <= 10 && (
                        <p className="text-xs font-semibold text-destructive">Only {stock} left!</p>
                    )}
                </div>
            </div>
        </Card>
      </Link>
    );

    const B2BCard = () => (
        <Card className="overflow-hidden group flex flex-col hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <div className="relative w-full aspect-square">
                <Link href={href} className="block relative w-full h-full">
                    <Image
                        src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={product.imageHint}
                    />
                </Link>
                 <div className='absolute top-2 left-2 flex flex-col gap-1 z-10'>
                    {product.isSponsored && <Badge variant="premium">Sponsored</Badge>}
                    {product.isForging && <Badge className="bg-orange-500 text-white"><Hammer className="w-3 h-3 mr-1"/> Forging Deal</Badge>}
                    {product.isVerified && <VerifiedSeal size={24} />}
                  </div>
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between bg-card">
              <div className="space-y-2">
                 <h3 className="font-semibold leading-tight h-10 line-clamp-2 text-sm">
                    <Link href={href} className="hover:text-primary">
                        {product.name}
                    </Link>
                  </h3>
                   <p className="text-xs text-muted-foreground -mt-1">by {product.manufacturerName}</p>
                   <div className="flex items-baseline justify-between pt-1">
                    <p className="text-lg font-bold text-foreground">
                      {price > 0 ? `KES ${price.toLocaleString()}`: 'Inquire for Price'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold">{product.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                      <Package className="w-3 h-3" />
                      <span>MOQ: {product.moq || 1} units</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Lead: {product.leadTime || 'New Seller'}</span>
                      </div>
                  </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                 <RequestQuoteModal product={product} source={source}>
                    <Button size="sm" className="w-full">Request Quote</Button>
                </RequestQuoteModal>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="flex items-center justify-center p-2 border rounded-lg hover:bg-muted"
                                onClick={() => toggleItem({ id: product.id, name: product.name, imageUrl: product.imageUrl || '' })}
                             >
                                <Checkbox 
                                    id={`compare-card-${product.id}`} 
                                    checked={isComparing} 
                                />
                             </div>
                        </TooltipTrigger>
                         <TooltipContent>
                           <p>Compare</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              </div>
            </div>
        </Card>
    );

    return isB2CView ? <B2CCard /> : <B2BCard />;
}
