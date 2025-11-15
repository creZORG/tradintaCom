

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, getDocs, where, query, collectionGroup } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/definitions';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/product-card';

type WishlistItem = {
  id: string; // This is the productId
  addedAt: any;
};

type WishlistProduct = Product & { 
    id: string;
    shopId: string; 
    slug: string; 
    variants: { price: number, retailPrice?: number }[], 
    manufacturerName?: string, 
    isVerified?: boolean,
    listOnTradintaDirect?: boolean;
};

export default function WishlistPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const wishlistQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'wishlist');
    }, [user, firestore]);
    const { data: wishlistItems, isLoading: isLoadingWishlist, forceRefetch } = useCollection<WishlistItem>(wishlistQuery);
    
    const [wishlistProducts, setWishlistProducts] = React.useState<WishlistProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);

    React.useEffect(() => {
      const fetchProductDetails = async () => {
        if (!firestore || !wishlistItems || wishlistItems.length === 0) {
          setWishlistProducts([]);
          setIsLoadingProducts(false);
          return;
        }
        
        setIsLoadingProducts(true);
        const productIds = wishlistItems.map(item => item.id);
        
        try {
          if (productIds.length > 0) {
            const productsQuery = query(collectionGroup(firestore, 'products'), where('id', 'in', productIds));
            const productSnapshots = await getDocs(productsQuery);
            const products = productSnapshots.docs.map(doc => ({ ...doc.data(), id: doc.id } as WishlistProduct));
            setWishlistProducts(products);
          } else {
            setWishlistProducts([]);
          }
        } catch (error) {
          console.error("Error fetching product details for wishlist:", error);
          toast({ title: "Error", description: "Could not load wishlist items.", variant: "destructive"});
        } finally {
          setIsLoadingProducts(false);
        }
      };

      fetchProductDetails();
    }, [firestore, wishlistItems, toast]);

    const isLoading = isLoadingWishlist || isLoadingProducts;

    if (isLoading) {
        return (
             <div className="container mx-auto py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            </div>
        )
    }

  return (
     <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            My Wishlist
          </CardTitle>
          <CardDescription>
            Products you've saved for later. Prices and availability may change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wishlistProducts.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {wishlistProducts.map(product => (
                    <ProductCard key={product.id} product={product as any} context={product.listOnTradintaDirect ? 'b2c' : 'b2b'} />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Your wishlist is empty</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start browsing to find products you'd like to save for later.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/products">
                  <Search className="mr-2 h-4 w-4" /> Browse Products
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
