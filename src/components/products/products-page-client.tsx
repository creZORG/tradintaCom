

'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  ListFilter,
  Search,
  ShoppingBag,
  X,
  History,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { type Product } from '@/lib/definitions';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import { InteractionService } from '@/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { logFeatureUsage } from '@/lib/analytics';
import { ProductCard } from '@/components/product-card';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FilterSidebar } from '@/components/products/filter-sidebar';
import { CategoryScroller } from '@/components/products/category-scroller';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { PromoCarousel } from '@/components/products/promo-carousel';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';


type ProductWithShopId = ProductWithRanking & {
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
  searchKeywords?: string[];
};

type PlatformSettings = {
    enableTradintaDirect?: boolean;
}

const PRODUCTS_PER_PAGE = 12;

export function ProductsPageClient({
  initialProducts,
  initialCategory,
}: {
  initialProducts: ProductWithShopId[];
  initialCategory?: string;
}) {
  const { user, role } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchContainerRef = React.useRef<HTMLDivElement>(null);


  const [allProducts, setAllProducts] =
    React.useState<ProductWithShopId[]>(initialProducts);
  const [isLoading, setIsLoading] = React.useState(!initialProducts.length);
  const [followedSellerIds, setFollowedSellerIds] = React.useState<string[]>([]);
  
  const activeTab = searchParams.get('tab') || 'for-you';
  
  const platformSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'config') : null, [firestore]);
  const { data: platformSettings, isLoading: isLoadingSettings } = useDoc<PlatformSettings>(platformSettingsRef);
  const isDirectEnabled = platformSettings?.enableTradintaDirect ?? true;

  const [recentSearches, setRecentSearches] = useLocalStorageState<string[]>('product-recent-searches', []);
  const [showRecent, setShowRecent] = React.useState(false);

  
  const createQueryString = React.useCallback(
    (paramsToUpdate: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const [filters, setFilters] = React.useState({
    category: searchParams.get('category') || 'all',
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    county: searchParams.get('county') || 'all',
    moq: searchParams.get('moq') || '',
    moqRange: '5',
    rating: searchParams.get('rating') || 'all',
  });

  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const keysToRemove = ['q']; // Keep category when switching main tabs
    keysToRemove.forEach(key => params.delete(key));
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  }
  
  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
      const newFilters = { ...filters, [filterName]: value };
      setFilters(newFilters);
  }
  
  const applyFiltersToUrl = () => {
    const queryParams: Record<string, string | undefined> = {};
      for (const [key, val] of Object.entries(filters)) {
          if(key !== 'moqRange') {
             queryParams[key] = String(val) || undefined;
          }
      }
    router.push(`${pathname}?${createQueryString(queryParams)}`);
  }
  
  React.useEffect(() => {
    const newFilters = {
        category: searchParams.get('category') || 'all',
        verifiedOnly: searchParams.get('verifiedOnly') === 'true',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        county: searchParams.get('county') || 'all',
        moq: searchParams.get('moq') || '',
        moqRange: '5',
        rating: searchParams.get('rating') || 'all',
    };
    setFilters(newFilters);
    setSearchQuery(searchParams.get('q') || '');
    setCurrentPage(1);
  }, [searchParams]);

  React.useEffect(() => {
    async function fetchInitialData() {
        setIsLoading(true);
        const products = await getRankedProducts(user?.uid || null);
        setAllProducts(products);
        if (user) {
            const followedIds = await InteractionService.getFollowedSellerIds(user.uid);
            setFollowedSellerIds(followedIds);
        }
        setIsLoading(false);
    }
    if (!initialProducts.length || user) { // Fetch if initial list is empty or user logs in
      fetchInitialData();
    }
  }, [initialProducts, user]);
  
  const executeSearch = (query: string) => {
    setShowRecent(false);
    if(query) {
       // Add to recent searches, avoiding duplicates and keeping the list to 5
      setRecentSearches(prev => [query, ...prev.filter(s => s !== query)].slice(0, 5));
    }
    logFeatureUsage({
        feature: 'product:search',
        userId: user?.uid || 'guest',
        userRole: role || 'guest',
        metadata: { query }
    });
    router.push(`${pathname}?${createQueryString({ q: query || undefined, tab: activeTab, category: undefined })}`);
  }

  const handleResetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    const keysToKeep = ['tab', 'q'];
    const newParams = new URLSearchParams();
    keysToKeep.forEach(key => {
        if(params.has(key)) {
            newParams.set(key, params.get(key)!);
        }
    });
    router.push(`${pathname}?${newParams.toString()}`);
  }

  const { filteredProducts, totalPages } =
    React.useMemo(() => {
      if (!allProducts)
        return {
          filteredProducts: [],
          totalPages: 0,
        };

      let products = allProducts.filter((product) => {
        const matchesCategory =
          filters.category === 'all' || product.category === filters.category;
        
        const matchesSearch =
          searchQuery === '' ||
          (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          product.searchKeywords?.some(kw => kw.includes(searchQuery.toLowerCase())));
          
        const matchesVerification = !filters.verifiedOnly || product.isVerified;
        
        const priceToCompare = activeTab === 'direct' ? product.variants?.[0]?.retailPrice : product.variants?.[0]?.price;
        const productPrice = priceToCompare ?? 0;

        const minPrice = parseFloat(filters.minPrice);
        const maxPrice = parseFloat(filters.maxPrice);
        const matchesMinPrice = isNaN(minPrice) || productPrice >= minPrice;
        const matchesMaxPrice = isNaN(maxPrice) || productPrice <= maxPrice;
        
        const matchesCounty = !filters.county || filters.county === 'all' || product.manufacturerLocation?.toLowerCase().includes(filters.county.toLowerCase());
        
        const targetMoq = parseInt(filters.moq);
        const moqRange = parseInt(filters.moqRange);
        let matchesMoq = true;
        if (activeTab !== 'direct' && !isNaN(targetMoq) && product.moq) {
            const lowerBound = Math.max(0, targetMoq - moqRange);
            const upperBound = targetMoq + moqRange;
            matchesMoq = product.moq >= lowerBound && product.moq <= upperBound;
        }

        const matchesRating = filters.rating === 'all' || (product.rating || 0) >= parseInt(filters.rating);

        let matchesTab = true;
        if (activeTab === 'following') {
            matchesTab = followedSellerIds.includes(product.manufacturerId);
        } else if (activeTab === 'direct') {
            matchesTab = !!product.listOnTradintaDirect;
        }

        return matchesCategory && matchesSearch && matchesVerification && matchesMinPrice && matchesMaxPrice && matchesCounty && matchesMoq && matchesRating && matchesTab;
      });
        
      const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

      return {
        filteredProducts: products,
        totalPages,
      };
    }, [allProducts, filters, searchQuery, activeTab, followedSellerIds]);

  const currentProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowRecent(false);
        }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  const ProductGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      );
    }

    if (currentProducts.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentProducts.map((product) => (
            <ProductCard key={product.id} product={product} context={activeTab === 'direct' ? 'b2c' : 'b2b'}/>
        ))}
      </div>
    );
  };


  return (
    <div className="container mx-auto py-8">
      <section className="relative h-[40vh] lg:h-[50vh] rounded-lg overflow-hidden -mt-8 -mx-4 mb-8">
        <PromoCarousel />
      </section>
      
      <section className="mb-8">
        <CategoryScroller />
      </section>

      {activeTab === 'direct' && (
        <Card className="mb-8 bg-blue-900 text-white">
          <CardContent className="p-4 flex items-center justify-center text-center gap-4">
            <ShoppingBag className="h-10 w-10 text-blue-300" />
            <div>
              <h3 className="text-lg font-bold">Welcome to Tradinta Direct</h3>
              <p className="text-sm text-blue-200 max-w-2xl">
                Shop consumer-ready products with confidence. Look for the "Direct" badge—every item is stored in our warehouse and fulfilled by Tradinta, guaranteed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <h1 className="text-4xl font-bold font-headline mb-2">
          Tradinta Commerce
        </h1>
        <p className="text-muted-foreground">
          Source directly from Africa’s top manufacturers.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 mt-6">
        <aside className="hidden lg:block lg:col-span-1">
          <FilterSidebar 
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFiltersToUrl}
            onResetFilters={handleResetFilters}
            activeTab={activeTab as any}
          />
        </aside>

        <main className="lg:col-span-3">
          <div className="mb-6" ref={searchContainerRef}>
             <form className="flex flex-col md:flex-row gap-4 relative" onSubmit={(e) => { e.preventDefault(); executeSearch(searchQuery); }}>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search for products or manufacturers..."
                  className="pl-10 text-base"
                  value={searchQuery}
                  onFocus={() => setShowRecent(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
                 {showRecent && recentSearches.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-md shadow-lg z-10">
                    <div className="p-2 text-xs font-semibold text-muted-foreground">Recent Searches</div>
                    <ul>
                      {recentSearches.map((term) => (
                        <li key={term} className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer"
                            onMouseDown={(e) => { e.preventDefault(); executeSearch(term); }}>
                          <span className="flex items-center gap-2"><History className="w-4 h-4" /> {term}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={(e) => {
                            e.stopPropagation();
                            setRecentSearches(prev => prev.filter(s => s !== term));
                          }}>
                            <X className="w-4 h-4"/>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" className="w-full md:w-auto">
                    <Search className="mr-2 h-4 w-4"/> Search
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                     <Button variant="outline" className="w-full justify-center gap-2 lg:hidden">
                      <ListFilter className="h-5 w-5" /> All Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <FilterSidebar 
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onApplyFilters={applyFiltersToUrl}
                        onResetFilters={handleResetFilters}
                        activeTab={activeTab as any}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </form>
          </div>
          
           <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
                <TabsList className="bg-transparent p-0 gap-2">
                    <TabsTrigger value="for-you" className="px-4 py-2 rounded-full border data-[state=active]:bg-blue-600 data-[state=active]:text-primary-foreground data-[state=active]:border-blue-600">For You</TabsTrigger>
                    <TabsTrigger value="following" className="px-4 py-2 rounded-full border data-[state=active]:bg-blue-600 data-[state=active]:text-primary-foreground data-[state=active]:border-blue-600">Following</TabsTrigger>
                    {isDirectEnabled && (
                        <TabsTrigger value="direct" className="px-4 py-2 rounded-full border data-[state=active]:bg-blue-600 data-[state=active]:text-primary-foreground data-[state=active]:border-blue-600 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5"/>
                            Direct
                        </TabsTrigger>
                    )}
                </TabsList>
            </Tabs>
            
            <div className="space-y-12">
              <div>
                <ProductGrid />
                {totalPages > 1 && (
                    <Pagination className="mt-8">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(1, currentPage - 1)); }} disabled={currentPage === 1}/>
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}>
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(totalPages, currentPage + 1)); }} disabled={currentPage === totalPages} />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
              </div>
            </div>

          {filteredProducts.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12 bg-muted/50 rounded-lg mt-8">
                <h3 className="text-lg font-semibold">No Results Found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
