
'use client';

import * as React from 'react';
import { Card } from "@/components/ui/card";
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
             <Skeleton key={i} className="h-24 w-64 rounded-2xl" />
        ))
    );
    
    const renderCategoryCard = (category: ProductCategory) => {
        const features = featuredContent[category.id] || [];
        // If there are multiple advertisers, pick one at random to display
        const displayFeature = features.length > 0
            ? features[Math.floor(Math.random() * features.length)]
            : { imageUrl: category.imageUrl, href: `/category/${category.id}` };

        return (
            <Link key={category.id} href={displayFeature.href} className="block">
                <Card 
                    className="shrink-0 cursor-pointer group bg-muted/50 hover:bg-muted transition-shadow duration-300 border rounded-2xl shadow-lg hover:shadow-primary/30 w-64"
                >
                    <div className="flex items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                                <Image 
                                    src={displayFeature.imageUrl || `https://picsum.photos/seed/${category.id}/128/128`} 
                                    alt={category.name} 
                                    fill 
                                    className="object-cover" 
                                    data-ai-hint={category.imageHint}
                                />
                            </div>
                            <div className="text-card-foreground">
                                <h4 className="font-bold text-lg leading-tight">{category.name}</h4>
                                <p className="text-sm text-muted-foreground">{productCounts[category.name]?.toLocaleString() || 0} items</p>
                            </div>
                        </div>
                        <div className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-5 h-5" />
                        </div>
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
