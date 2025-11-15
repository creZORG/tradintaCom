
import type { Product } from '@/lib/definitions';

export type ProductWithRanking = Product & {
    tradRank: number;
    manufacturerName?: string;
    manufacturerSlug?: string;
    manufacturerLocation?: string;
    isVerified?: boolean;
    shopId?: string;
    slug: string;
    isSponsored?: boolean;
    leadTime?: string;
    searchKeywords?: string[];
    // Ensure timestamps are strings for client components
    createdAt?: string; 
    updatedAt?: string;
};

export interface SearchOptions {
    searchQuery?: string;
    category?: string;
    verifiedOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
    moq?: number;
    moqRange?: number;
    rating?: number;
    page?: number;
    limit?: number;
    userId?: string | null;
    followedSellerIds?: string[];
    isDirect?: boolean;
}

export interface PaginatedProducts {
    products: ProductWithRanking[];
    totalCount: number;
    totalPages: number;
}
