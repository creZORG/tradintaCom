
'use client';

import * as React from 'react';
import { ProductService } from '@/services';
import type { Product } from '@/lib/definitions';

// Custom hook to fetch product data
export function useProductData(ids: string[]) {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [notFoundIds, setNotFoundIds] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (ids.length === 0) {
            setIsLoading(false);
            setProducts([]);
            setNotFoundIds([]);
            return;
        }

        async function fetchData() {
            setIsLoading(true);
            try {
                const fetchedProducts = await ProductService.getProductsByIds(ids);
                const foundIds = new Set(fetchedProducts.map(p => p.id));
                const missingIds = ids.filter(id => !foundIds.has(id));

                setProducts(fetchedProducts);
                setNotFoundIds(missingIds);
            } catch (error) {
                console.error("Failed to fetch product data:", error);
                setProducts([]);
                setNotFoundIds(ids);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [ids.join(',')]); // Rerun effect when ids array content changes, converted to string for dependency stability

    return { products, notFoundIds, isLoading };
}
