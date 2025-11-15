
'use client';

import * as React from 'react';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { type ProductWithRanking } from '@/services/DiscoveryEngine.d';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface CategoryProductGridProps {
  products: ProductWithRanking[];
  subcategories: string[];
}

export function CategoryProductGrid({ products, subcategories }: CategoryProductGridProps) {
  const [activeSubcategory, setActiveSubcategory] = React.useState<string | null>(null);

  const filteredProducts = React.useMemo(() => {
    if (!activeSubcategory) {
      return products;
    }
    return products.filter(p => p.subcategory === activeSubcategory);
  }, [products, activeSubcategory]);
  
  const getProductCount = (subcategory: string | null) => {
    if (!subcategory) {
      return products.length;
    }
    return products.filter(p => p.subcategory === subcategory).length;
  }

  const SubCategoryCard = ({ name, isActive, onClick }: { name: string | null, isActive: boolean, onClick: () => void }) => (
    <Card 
        className={cn(
            "shrink-0 cursor-pointer group bg-muted/50 hover:bg-muted transition-shadow duration-300 border rounded-2xl shadow-lg hover:shadow-primary/30",
            isActive && "bg-primary text-primary-foreground border-primary"
        )}
        onClick={onClick}
    >
        <div className="flex items-center justify-between gap-4 p-3">
            <div className="text-card-foreground">
                <h4 className={cn("font-bold text-base leading-tight", isActive && "text-primary-foreground")}>{name || 'All Products'}</h4>
                <p className={cn("text-xs text-muted-foreground", isActive && "text-primary-foreground/80")}>{getProductCount(name)} items</p>
            </div>
            <div className={cn("text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform", isActive && "text-primary-foreground")}>
                <ArrowRight className="w-4 h-4" />
            </div>
        </div>
    </Card>
  );

  return (
    <div>
      {subcategories && subcategories.length > 0 && (
        <div className="mb-8">
           <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-3 pb-4">
                    <SubCategoryCard name={null} isActive={!activeSubcategory} onClick={() => setActiveSubcategory(null)} />
                    {subcategories.map((sub) => (
                        <SubCategoryCard key={sub} name={sub} isActive={activeSubcategory === sub} onClick={() => setActiveSubcategory(sub)} />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product as any} context="b2b" source="category_page"/>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg">
          <h3 className="text-xl font-semibold">No Products Found</h3>
          <p className="mt-2">There are no products available in this subcategory yet.</p>
        </div>
      )}
    </div>
  );
}
