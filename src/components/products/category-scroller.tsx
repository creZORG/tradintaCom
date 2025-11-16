

'use client';

import * as React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getProductCategories, type ProductCategory } from '@/app/lib/data';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { getRankedProducts, getFeaturedCategoryContent } from '@/services/DiscoveryEngine';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

type FeaturedContent = {
    imageUrl: string;
    href: string;
    sellerName?: string;
    sellerSlug?: string;
}

export function CategoryScroller() {
    const router = useRouter();
    
    const [categories, setCategories] = React.useState<ProductCategory[]>([]);
    const [productCounts, setProductCounts] = React.useState<Record<string, number>>({});
    const [featuredContent, setFeaturedContent] = React.useState<Record<string, FeaturedContent[]>>({});
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const [fetchedCategories, rankedData] = await Promise.all([
                getProductCategories(),
                getRankedProducts(null)
            ]);

            const counts: Record<string, number> = {};
            fetchedCategories.forEach(cat => {
                counts[cat.name] = 0;
            });

            if (rankedData && rankedData.products) {
                rankedData.products.forEach(product => {
                    if (product.category && counts[product.category] !== undefined) {
                        counts[product.category]++;
                    }
                });
            }

            const features: Record<string, FeaturedContent[]> = {};
            for (const cat of fetchedCategories) {
                features[cat.id] = await getFeaturedCategoryContent(cat);
            }

            setCategories(fetchedCategories);
            setProductCounts(counts);
            setFeaturedContent(features);
            setIsLoading(false);
        }
        fetchData();
    }, []);
    
    const renderSkeleton = (count: number) => (
        Array.from({ length: count }).map((_, i) => (
             <Skeleton key={i} className="h-40 w-60 rounded-xl" />
        ))
    );
    
    const renderCategoryCard = (category: ProductCategory) => {
        const features = featuredContent[category.id] || [];
        const displayFeature = features.length > 0
            ? features[Math.floor(Math.random() * features.length)]
            : { imageUrl: category.imageUrl, href: `/category/${category.id}` };

        return (
            <Link key={category.id} href={displayFeature.href} className="block shrink-0">
                <Card 
                    className="group w-60 overflow-hidden rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="relative h-24 w-full">
                        <Image 
                            src={displayFeature.imageUrl || `https://picsum.photos/seed/${category.id}/400/200`} 
                            alt={category.name} 
                            fill 
                            className="object-cover transition-transform duration-300 group-hover:scale-105" 
                            data-ai-hint={category.imageHint}
                        />
                    </div>
                    <div className="p-4 bg-background">
                         <h4 className="font-bold text-base leading-tight truncate group-hover:text-primary transition-colors">{category.name}</h4>
                         <p className="text-sm text-muted-foreground">{productCounts[category.name]?.toLocaleString() || 0} items</p>
                    </div>
                </Card>
            </Link>
        );
    }

    return (
      <div className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
              {isLoading ? renderSkeleton(5) : categories.map(renderCategoryCard)}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
    </div>
    );
};
