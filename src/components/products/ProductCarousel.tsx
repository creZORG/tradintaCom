
'use client';

import * as React from 'react';
import Autoplay from "embla-carousel-autoplay";
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { SellerService, ProductService, DiscoveryEngine } from '@/services';
import { cn } from '@/lib/utils';


export function ProductCarousel() {
  const [featuredProducts, setFeaturedProducts] = React.useState<ProductWithRanking[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  const autoplayPlugin = React.useRef(
      Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  React.useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setIsLoading(true);
      try {
        // 1. Check for manually pinned products in the 'products-page-carousel' ad slot.
        const adSlots = await SellerService.getAdSlots();
        const carouselSlot = adSlots.find(slot => slot.id === 'products-page-carousel');
        
        let products: ProductWithRanking[] = [];

        if (carouselSlot && carouselSlot.pinnedEntityIds && carouselSlot.pinnedEntityIds.length > 0) {
            // 2. If found, fetch those specific products.
            const pinnedProducts = await ProductService.getProductsByIds(carouselSlot.pinnedEntityIds.map(e => e.id));
             products = pinnedProducts.map(p => ({
                ...p,
                tradRank: 0, // Rank is not relevant for manually pinned items
            })) as ProductWithRanking[];
        } else {
            // 3. Fallback: Fetch top-ranked, verified products and randomize them.
            const allRankedData = await DiscoveryEngine.getRankedProducts({ verifiedOnly: true });
            const productPool = allRankedData.products.filter(p => p.imageUrl);
            const shuffled = productPool.sort(() => 0.5 - Math.random());
            products = shuffled.slice(0, 7);
        }
        setFeaturedProducts(products);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);


  if (isLoading) {
    return <Skeleton className="w-full h-full aspect-video rounded-xl" />;
  }

  if (featuredProducts.length === 0) {
    return null; // Don't render if there's nothing to show
  }
  
  return (
    <div>
        <Carousel
        className="w-full"
        plugins={[autoplayPlugin.current]}
        opts={{ loop: true }}
        setApi={setApi}
        >
        <CarouselContent>
            {featuredProducts.map(product => (
            <CarouselItem key={product.id}>
                <div className="p-1">
                <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
                    <CardContent className="relative flex aspect-video items-center justify-center p-0">
                    <Image
                        src={product.imageUrl || 'https://placehold.co/1280x720'}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        data-ai-hint={product.imageHint}
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
                    <div className="absolute bottom-0 left-0 p-6 md:p-10">
                        <Badge variant="secondary" className="mb-2 bg-white/90 text-black">Featured Product</Badge>
                        <h2 className="font-headline text-2xl font-bold text-white md:text-4xl">
                        {product.name}
                        </h2>
                        <p className="mt-2 max-w-lg text-base text-white/90 md:text-lg">
                        {product.description?.substring(0, 100)}...
                        </p>
                        <Button asChild className="mt-4">
                        <Link href={`/products/${product.shopId}/${product.slug}`}>View Details</Link>
                        </Button>
                    </div>
                    </CardContent>
                </Card>
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 hover:text-white" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 hover:text-white" />
        </Carousel>
        <div className="py-2 flex justify-center gap-2">
            {featuredProducts.map((_, index) => (
                <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={cn(
                        "h-2 w-2 rounded-full bg-muted-foreground/50 transition-all duration-300",
                        current === index ? "w-6 bg-primary" : "hover:bg-muted-foreground"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
      </div>
    </div>
  );
}

export default ProductCarousel;
