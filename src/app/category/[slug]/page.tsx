
'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { getCategoryBySlug } from '@/app/lib/data';
import { getRankedProducts, getFeaturedCategoryContent } from '@/services/DiscoveryEngine';
import { getAuth } from "firebase-admin/auth";
import { cookies } from 'next/headers';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { SearchOptions } from '@/services/DiscoveryEngine.d';
import { CategoryProductGrid } from '@/components/products/CategoryProductGrid';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Button } from '@/components/ui/button';

type FeaturedContent = {
    imageUrl: string;
    href: string;
    sellerName?: string;
    sellerSlug?: string;
};

const AdCarousel = ({ items, categoryName }: { items: FeaturedContent[], categoryName: string }) => {
    const autoplayPlugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
    );
    
    // If only one item and it's the default category image, render a static image.
    if (items.length <= 1 && !items[0]?.sellerName) {
        return (
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-8">
                <Image 
                    src={items[0]?.imageUrl || 'https://picsum.photos/seed/cat-header/1600/400'}
                    alt={categoryName}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-white text-center">
                        {categoryName}
                    </h1>
                </div>
            </div>
        );
    }

    return (
        <Carousel
            className="w-full mb-8"
            plugins={[autoplayPlugin.current]}
            opts={{ loop: items.length > 1 }}
        >
            <CarouselContent>
                {items.map((item, index) => (
                    <CarouselItem key={index}>
                        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden group">
                             <Image 
                                src={item.imageUrl || 'https://picsum.photos/seed/cat-header/1600/400'}
                                alt={item.sellerName || categoryName}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h1 className="text-4xl md:text-5xl font-bold font-headline text-white text-center">
                                    {categoryName}
                                </h1>
                            </div>
                            {item.sellerName && item.sellerSlug && (
                                <div className="absolute bottom-4 right-4 text-right text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs">Image by</p>
                                    <Link href={`/manufacturer/${item.sellerSlug}`} className="font-bold hover:underline">{item.sellerName}</Link>
                                </div>
                            )}
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
};

function CategoryDataFetcher({ slug }: { slug: string }) {
    const [userId, setUserId] = React.useState<string | null>(null);
    const [category, setCategory] = React.useState<any>(null);
    const [initialData, setInitialData] = React.useState<any>({ products: [] });
    const [featuredContent, setFeaturedContent] = React.useState<FeaturedContent[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            // This is a client component, so we can't use server-side auth easily.
            // In a real app, you'd get the user from your client-side auth context.
            // For now, we'll assume a null user.
            const tempUserId = null; 
            setUserId(tempUserId);
            
            const categoryData = await getCategoryBySlug(slug);
            if (!categoryData) {
                setIsLoading(false);
                return;
            }
            setCategory(categoryData);

            const options: SearchOptions = {
                userId: tempUserId,
                category: categoryData.name,
                limit: 100,
            };

            const [rankedProducts, featured] = await Promise.all([
                getRankedProducts(options),
                getFeaturedCategoryContent(categoryData)
            ]);

            setInitialData(rankedProducts);
            
            // Randomize and limit featured content for carousel
            const shuffled = featured.sort(() => 0.5 - Math.random());
            setFeaturedContent(shuffled.slice(0, 3));
            
            setIsLoading(false);
        }
        fetchData();
    }, [slug]);

    const subcategoryText = React.useMemo(() => {
        if (!category?.subcategories || category.subcategories.length === 0) {
            return null;
        }
        const visibleSubcategories = category.subcategories.slice(0, 2);
        const remainingCount = category.subcategories.length - visibleSubcategories.length;
        
        let text = `Explore our range of ${category.name}, including ${visibleSubcategories.join(', ')}`;
        if (remainingCount > 0) {
            text += ` and ${remainingCount} more.`;
        } else {
            text += '.';
        }
        return text;
    }, [category]);

    if (isLoading) {
         return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (!category) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8">
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/products">Products</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{category.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <AdCarousel items={featuredContent} categoryName={category.name} />

            {subcategoryText && (
                <p className="text-center text-muted-foreground mb-4">
                    {subcategoryText}
                </p>
            )}
            <CategoryProductGrid 
                products={initialData.products} 
                subcategories={category.subcategories}
            />
        </div>
    );
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <CategoryDataFetcher slug={params.slug} />
        </Suspense>
    );
}
