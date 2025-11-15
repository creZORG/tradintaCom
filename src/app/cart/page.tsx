

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, ArrowRight, Wallet, Loader2, Tag } from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, writeBatch, setDoc, serverTimestamp, getDocs, where, query, collectionGroup } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/definitions';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

type CartItem = {
  id: string; // This is the productId
  addedAt: any;
  quantity: number;
};

type CartProduct = Product & { 
    id: string;
    shopId: string; 
    slug: string; 
    variants: { price: number, retailPrice?: number }[], 
    manufacturerName?: string, 
    isVerified?: boolean,
    listOnTradintaDirect?: boolean;
    quantityInCart: number;
};

export default function CartPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isCheckingOut, setIsCheckingOut] = React.useState(false);
    
    const cartQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'cart');
    }, [user, firestore]);
    const { data: cartItems, isLoading: isLoadingCart, forceRefetch } = useCollection<CartItem>(cartQuery);
    
    const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    useEffect(() => {
      const fetchProductDetails = async () => {
        if (!firestore || !cartItems || cartItems.length === 0) {
          setCartProducts([]);
          setIsLoadingProducts(false);
          return;
        }
        
        setIsLoadingProducts(true);
        const productIds = cartItems.map(item => item.id);
        
        try {
          if (productIds.length > 0) {
            const productsQuery = query(collectionGroup(firestore, 'products'), where('id', 'in', productIds));
            const productSnapshots = await getDocs(productsQuery);

            const productsWithQuantities = productSnapshots.docs.map(doc => {
              const productData = { ...doc.data(), id: doc.id } as CartProduct;
              const cartItem = cartItems.find(item => item.id === productData.id);
              return { ...productData, quantityInCart: cartItem?.quantity || 1 };
            });

            setCartProducts(productsWithQuantities);
          } else {
            setCartProducts([]);
          }
        } catch (error) {
          console.error("Error fetching product details for cart:", error);
          toast({ title: "Error", description: "Could not load cart items.", variant: "destructive"});
        } finally {
          setIsLoadingProducts(false);
        }
      };

      fetchProductDetails();
    }, [firestore, cartItems, toast]);

    const subtotal = React.useMemo(() => {
        if (!cartProducts) return 0;
        return cartProducts.reduce((sum, item) => {
             const price = item.variants?.[0]?.retailPrice || 0;
             return sum + (price * item.quantityInCart);
        }, 0);
    }, [cartProducts]);
    
    const handleRemove = async (productId: string) => {
        if (!user || !firestore) return;
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', productId);
        try {
            await deleteDoc(cartItemRef);
            forceRefetch();
            toast({ title: 'Item removed from cart' });
        } catch (error: any) {
            toast({ title: 'Error', description: `Could not remove item: ${error.message}`, variant: 'destructive'});
        }
    };

    const handleCheckout = async () => {
        if (!firestore || !user || cartProducts.length === 0) return;
        setIsCheckingOut(true);

        try {
            const calculatedSubtotal = cartProducts.reduce((sum, item) => sum + (item.variants?.[0]?.retailPrice || 0) * item.quantityInCart, 0);
            const platformFee = calculatedSubtotal * 0.012; // Default 1.2%
            const processingFee = calculatedSubtotal * 0.02; // Default 2%
            const total = calculatedSubtotal + platformFee + processingFee;

            const orderRef = doc(collection(firestore, 'orders'));
            const orderData = {
                id: orderRef.id,
                buyerId: user.uid,
                buyerName: user.displayName || 'Tradinta Buyer',
                sellerId: 'tradinta-direct', 
                sellerName: 'Tradinta Direct',
                orderDate: serverTimestamp(),
                subtotal: calculatedSubtotal,
                platformFee: platformFee,
                processingFee: processingFee,
                totalAmount: total,
                status: 'Pending Payment', 
                items: cartProducts.map((item: any) => ({
                    productId: item.id,
                    productName: item.name,
                    shopId: item.shopId,
                    quantity: item.quantityInCart,
                    unitPrice: item.variants?.[0]?.retailPrice || 0,
                    imageUrl: item.imageUrl,
                })),
                isTradintaDirect: true,
            };
            await setDoc(orderRef, orderData);

            const batch = writeBatch(firestore);
            cartProducts.forEach(item => {
                const itemRef = doc(firestore, 'users', user.uid, 'cart', item.id);
                batch.delete(itemRef);
            });
            await batch.commit();

            toast({ title: "Redirecting to checkout..." });
            router.push(`/checkout/${orderRef.id}`);

        } catch (error: any) {
             toast({
                title: "Checkout Error",
                description: `Could not initiate checkout: ${error.message}`,
                variant: 'destructive',
                duration: 10000,
            });
            setIsCheckingOut(false);
        }
    };

    const isLoading = isLoadingCart || isLoadingProducts;

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="space-y-6">
                    <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                    </Card>
                </div>
            </div>
        )
    }

  return (
    <div className="container mx-auto py-8">
        <div className="space-y-6">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-primary" />
                My Shopping Cart
            </CardTitle>
            <CardDescription>
                Review the items you've added for direct purchase. These items are fulfilled by Tradinta.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {cartProducts.length > 0 ? (
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        {cartProducts.map((product, index) => (
                            <React.Fragment key={product.id}>
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="relative aspect-square w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                                <Image
                                    src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                <Link href={`/direct/${product.slug}`} className="font-semibold hover:text-primary transition-colors">{product.name}</Link>
                                <p className="text-sm text-muted-foreground">{product.manufacturerName}</p>
                                <p className="text-sm font-semibold mt-1">Qty: {product.quantityInCart}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-lg font-bold">KES {((product.variants?.[0]?.retailPrice || 0) * product.quantityInCart).toLocaleString()}</p>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemove(product.id)}>
                                        <Trash2 className="w-5 h-5" />
                                        <span className="sr-only">Remove item</span>
                                    </Button>
                                </div>
                            </div>
                            {index < cartProducts.length - 1 && <Separator />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>KES {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Fees & Shipping</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col gap-4 border-t pt-4">
                                <Button className="w-full" size="lg" disabled={isCheckingOut || subtotal <= 0} onClick={handleCheckout}>
                                {isCheckingOut ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Wallet className="mr-2 h-5 w-5" />
                                )}
                                Proceed to Checkout
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Your cart is empty</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Browse products available for direct purchase to get started.
                </p>
                <Button className="mt-4" asChild>
                    <Link href="/products?tab=direct">
                    Shop Tradinta Direct
                    </Link>
                </Button>
                </div>
            )}
            </CardContent>
        </Card>
        </div>
    </div>
  );
}
