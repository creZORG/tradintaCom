
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/app/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Let's assume the first 3 products are in the wishlist for this mock page
const wishlistItems = products.slice(0, 3);
// const wishlistItems: typeof products = []; // Use this line to test the empty state

export default function WishlistPage() {
  return (
    <div className="space-y-6">
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
          {wishlistItems.length > 0 ? (
            <div className="space-y-4">
              {wishlistItems.map((product, index) => (
                <React.Fragment key={product.id}>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative aspect-square w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-semibold hover:text-primary transition-colors">{product.name}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      <p className="text-lg font-bold mt-1">KES {product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 self-start md:self-center">
                      <Button variant="outline">Request Quotation</Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-5 h-5" />
                        <span className="sr-only">Remove from wishlist</span>
                      </Button>
                    </div>
                  </div>
                  {index < wishlistItems.length - 1 && <Separator />}
                </React.Fragment>
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
