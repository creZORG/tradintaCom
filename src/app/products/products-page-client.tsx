
'use client';

import * as React from 'react';
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
  X,
  History,
  ShoppingCart,
  UserPlus,
  Settings,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { logFeatureUsage } from '@/lib/analytics';
import { ProductCard } from '@/components/product-card';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FilterSidebar } from '@/components/products/filter-sidebar';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import type { PaginatedProducts, SearchOptions, ProductWithRanking } from '@/services/DiscoveryEngine.d';
import { Button } from '@/components/ui/button';
import { CategoryScroller } from '@/components/products/category-scroller';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductCarousel } from '@/components/products/ProductCarousel';
import { ComparisonTray } from '@/components/products/comparison-tray';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PlatformSettings = {
    enableTradintaDirect?: boolean;
}

export function ProductsPageClient({ initialData }: { initialData: PaginatedProducts }) {
  const { user, role } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  const [productsData, setProductsData] = React.useState<PaginatedProducts>(initialData);
  const [isLoading, setIsLoading] = React.useState(!initialData);
  
  const activeTab = searchParams.get('tab') || 'for-you';
  
  const platformSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'config') : null, [firestore]);
  const { data: platformSettings } = useDoc<PlatformSettings>(platformSettingsRef);
  const isDirectEnabled = platformSettings?.enableTradintaDirect ?? true;

  const [recentSearches, setRecentSearches] = useLocalStorageState<string[]>('product-recent-searches', []);
  const [showRecent, setShowRecent] = React.useState(false);

  const createQueryString = React.useCallback(
    (paramsToUpdate: Record<string, string | number | boolean | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value !== undefined && value !== '' && value !== false) {
            params.set(name, String(value));
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
    subcategory: searchParams.get('subcategory') || '',
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    county: searchParams.get('county') || 'all',
    moq: searchParams.get('moq') || '',
    moqRange: searchParams.get('moqRange') || '50',
    rating: searchParams.get('rating') || 'all',
  });

  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '');
  
  const handleTabChange = (value: string) => {
    router.push(`${pathname}?${createQueryString({ tab: value, page: undefined, q: undefined })}`);
  }
  
  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
      setFilters(prev => ({ ...prev, [filterName]: value }));
  }
  
  const applyFiltersToUrl = () => {
    router.push(`${pathname}?${createQueryString({ ...filters, page: 1, tab: activeTab, q: searchQuery })}`);
  }
  
  React.useEffect(() => {
    setProductsData(initialData);
    setIsLoading(false);
  }, [initialData]);
  
  const executeSearch = (query: string) => {
    setShowRecent(false);
    if(query) {
      setRecentSearches(prev => [query, ...prev.filter(s => s !== query)].slice(0, 5));
    }
    logFeatureUsage({
        feature: 'product:search',
        userId: user?.uid || 'guest',
        userRole: role || 'guest',
        metadata: { query }
    });
    router.push(`${pathname}?${createQueryString({ q: query || undefined, page: 1, tab: activeTab })}`);
  }

  const handleResetFilters = () => {
    const paramsToKeep: Record<string, string | undefined> = {
        tab: searchParams.get('tab') || undefined,
    };
    const newParams = new URLSearchParams();
    for (const key in paramsToKeep) {
      if (paramsToKeep[key]) {
        newParams.set(key, paramsToKeep[key]!);
      }
    }
    router.push(`${pathname}?${newParams.toString()}`);
  }
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > productsData.totalPages) return;
    router.push(`${pathname}?${createQueryString({ page: page })}`);
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

  const { products, totalPages, totalCount } = productsData;
  
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
      if (key === 'category' && value === 'all') return false;
      if (key === 'subcategory' && value === '') return false;
      if (key === 'verifiedOnly' && value === false) return false;
      if (key === 'moqRange' && value === '50') return false;
      if (key === 'rating' || (key === 'county' && value === 'all')) return false;
      return value !== '' && value !== 'all';
  }).length + (searchQuery ? 1 : 0);
  
  const ProductGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      );
    }
    
    if (activeTab === 'following' && (!products || products.length === 0)) {
        return (
             <div className="text-center py-12 bg-muted/50 rounded-lg">
                <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Your Feed is Empty</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Follow manufacturers and partners to see their products here.
                </p>
            </div>
        )
    }

    if (!products || products.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
            <ProductCard key={product.id} product={product as any} context={activeTab === 'direct' ? 'b2c' : 'b2b'} source="products_page"/>
        ))}
      </div>
    );
  };


  return (
    <div className="container mx-auto py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="hidden lg:block lg:col-span-1">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFiltersToUrl}
            onResetFilters={handleResetFilters}
            activeTab={activeTab as any}
          />
        </aside>
        <div className="lg:col-span-3">
          <ProductCarousel />
        </div>
      </div>
      
      <section className="my-8">
        <CategoryScroller />
      </section>

      <div className="mb-6">
        <h1 className="text-4xl font-bold font-headline mb-2">
          Tradinta Commerce
        </h1>
        <p className="text-muted-foreground">
          Source directly from Africa’s top manufacturers.
        </p>
      </div>

      <main>
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
                     <Button variant="outline" className="w-full justify-center gap-2 lg:hidden relative">
                      <ListFilter className="h-5 w-5" /> All Filters
                      {activeFiltersCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{activeFiltersCount}</Badge>}
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
                            <ShoppingCart className="w-5 h-5"/>
                            Direct
                        </TabsTrigger>
                    )}
                </TabsList>
            </Tabs>
            
            {activeTab === 'following' && (
              <Card className="mb-6">
                  <CardHeader className="flex-row items-center justify-between">
                      <div>
                        <CardTitle>Your Feed</CardTitle>
                        <CardDescription>Products from manufacturers and partners you follow.</CardDescription>
                      </div>
                      <Button asChild variant="outline">
                          <Link href="/dashboards/buyer/settings">
                              <Settings className="mr-2 h-4 w-4" /> Manage Following
                          </Link>
                      </Button>
                  </CardHeader>
              </Card>
            )}
            
            <div className="space-y-4">
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-4 text-sm">
                    <p className="font-semibold">{totalCount.toLocaleString()} result{totalCount !== 1 ? 's' : ''}</p>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground">Applied:</span>
                      {searchQuery && <Badge variant="outline">"{searchQuery}"</Badge>}
                      {filters.category !== 'all' && <Badge variant="outline">{filters.category}</Badge>}
                      {filters.verifiedOnly && <Badge variant="outline">Verified Sellers</Badge>}
                       {filters.minPrice && <Badge variant="outline">Min Price: {filters.minPrice}</Badge>}
                      {filters.maxPrice && <Badge variant="outline">Max Price: {filters.maxPrice}</Badge>}
                      {filters.moq && <Badge variant="outline">MOQ: {filters.moq}</Badge>}
                      {filters.county !== 'all' && <Badge variant="outline">Location: {filters.county}</Badge>}
                      <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleResetFilters}>
                          <X className="mr-1 h-3 w-3" />
                          Clear All
                      </Button>
                    </div>
                </div>
              )}
              <div>
                <ProductGrid />
                {totalPages > 1 && (
                    <Pagination className="mt-8">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(Number(searchParams.get('page') || 1) - 1); }} />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink href="#" isActive={Number(searchParams.get('page') || 1) === i + 1} onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}>
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            )).slice(0, 5)} 
                            {totalPages > 5 && <PaginationItem><span className="px-3">...</span></PaginationItem>}
                            <PaginationItem>
                                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(Number(searchParams.get('page') || 1) + 1); }} />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
              </div>
            </div>

          {(products?.length || 0) === 0 && !isLoading && (
              <div className="col-span-full text-center py-12 bg-muted/50 rounded-lg mt-8">
                <h3 className="text-lg font-semibold">No Results Found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
            <ComparisonTray />
        </main>
    </div>
  );
}
