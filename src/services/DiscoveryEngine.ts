
'use server';

/**
 * @fileoverview The Core Discovery Engine for Tradinta.
 * This service is the "brain" of product discovery. It uses various data
 * provider services to fetch, filter, score, and rank products based on
 * relevance, quality, and personalization factors.
 *
 * It is the single source of truth for any part of the application that
 * needs to display a sorted list of products.
 */

import * as ProductService from '@/services/product-service';
import * as SellerService from '@/services/seller-service';
import * as InteractionService from '@/services/interaction-service';
import * as ModerationService from '@/services/moderation-service';
import type { Product, Manufacturer } from '@/lib/definitions';
import { type ProductCategory } from '@/app/lib/data';
import { Timestamp } from 'firebase-admin/firestore';
import type { ProductWithRanking, SearchOptions, PaginatedProducts } from './DiscoveryEngine.d';


// --- Scoring Weights ---
// These values can be tuned to adjust the ranking algorithm's behavior.
const SCORE_WEIGHTS = {
    MANUAL_OVERRIDE: 20000,      // Highest boost for manually pinned items.
    
    // Tiered Sponsorship Boosts
    SPONSORSHIP_TIER_1: 2000,   // e.g., 'Lift' plan
    SPONSORSHIP_TIER_2: 5000,   // e.g., 'Flow' plan
    SPONSORSHIP_TIER_3: 10000,  // e.g., 'Surge' plan

    VERIFIED_SELLER: 500,       // Boost for being a trusted, vetted manufacturer.
    RATING: 50,                 // Points per star rating (e.g., 4.8 stars = 240 points).
    REVIEW_COUNT: 1,            // Points per review.
    HAS_FOLLOW: 200,            // Boost if the user follows the manufacturer.
    IN_WISHLIST: 100,           // Boost if the product is in the user's wishlist.
    SHADOW_BAN_PENALTY: -5000,  // Heavy penalty for admin-flagged items.
    UNRESOLVED_REPORTS: -100,   // Penalty per unresolved report.
};

/**
 * The main function of the Discovery Engine.
 * Fetches, filters, scores, and ranks products.
 *
 * @param options - The search, filter, and pagination options.
 * @returns A promise that resolves to a paginated result of ranked products.
 */
export async function getRankedProducts(options: SearchOptions | null): Promise<PaginatedProducts> {

    const { 
        userId = null,
        searchQuery = '', 
        category = 'all', 
        verifiedOnly = false,
        minPrice,
        maxPrice,
        moq,
        moqRange = 50,
        rating,
        page = 1, 
        limit = 12,
        isDirect = false,
    } = options || {};

    // === STAGE 1: Data Ingestion (Parallel Fetching) ===
    // This now fetches ALL products from the efficient root collection.
    const [allProductsData, allSellers, followedSellerIds, wishlistedProductIds, adSlots] = await Promise.all([
        ProductService.getAllProducts(), // <<< USES ROOT /products COLLECTION
        SellerService.getSellersByIds([]),
        userId ? InteractionService.getFollowedSellerIds(userId) : Promise.resolve([]),
        userId ? InteractionService.getWishlistedProductIds(userId) : Promise.resolve([]),
        SellerService.getAdSlots(),
    ]);
    
    const allProducts = Array.isArray(allProductsData) ? allProductsData : [];
    
    const rankedProducts: ProductWithRanking[] = [];

    for (const product of allProducts) {
        if (!product || typeof product !== 'object' || !product.manufacturerId) {
            continue;
        }

        const seller = allSellers.get(product.manufacturerId);
        if (!seller) {
            continue; 
        }

        // === STAGE 2: Hard Filtering (The Ban Hammer) ===
        if (seller.suspensionDetails?.isSuspended) continue;
        if (isDirect && !product.listOnTradintaDirect) continue;
        
        // Filter based on options
        if (category !== 'all' && product.category !== category) continue;
        if (verifiedOnly && seller.verificationStatus !== 'Verified') continue;
        
        const priceToCompare = isDirect && product.variants?.[0]?.retailPrice ? product.variants[0].retailPrice : (product.variants?.[0]?.price ?? 0);
        
        if (minPrice !== undefined && priceToCompare < minPrice) continue;
        if (maxPrice !== undefined && priceToCompare > maxPrice) continue;
        
        if (moq !== undefined && !isDirect) {
            const productMoq = product.moq || 1;
            const lowerBound = Math.max(0, moq - moqRange);
            const upperBound = moq + moqRange;
            if (productMoq < lowerBound || productMoq > upperBound) {
                continue;
            }
        }
        
        if (rating !== undefined && (product.rating || 0) < rating) continue;

        if (searchQuery && !(
            product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            product.searchKeywords?.some(kw => kw.includes(searchQuery.toLowerCase()))
        )) continue;


        const manualProductOverride = adSlots.find(slot => slot.type === 'product' && Array.isArray(slot.pinnedEntityIds) && slot.pinnedEntityIds.some(p => p.id === product.id));

        let tradRank = 0;
        let isSponsored = false;

        // === STAGE 3: Scoring Engine ===
        if (manualProductOverride) {
            tradRank += SCORE_WEIGHTS.MANUAL_OVERRIDE;
            isSponsored = true;
        }

        const marketingPlan = await SellerService.getActiveMarketingPlan(seller.id);
        if (marketingPlan) {
            isSponsored = true;
            switch(marketingPlan.id) {
                case 'flow': tradRank += SCORE_WEIGHTS.SPONSORSHIP_TIER_2; break;
                case 'surge': tradRank += SCORE_WEIGHTS.SPONSORSHIP_TIER_3; break;
                case 'lift': default: tradRank += SCORE_WEIGHTS.SPONSORSHIP_TIER_1; break;
            }
        }

        if (seller.verificationStatus === 'Verified') tradRank += SCORE_WEIGHTS.VERIFIED_SELLER;
        tradRank += (product.rating || 0) * SCORE_WEIGHTS.RATING;
        tradRank += (product.reviewCount || 0) * SCORE_WEIGHTS.REVIEW_COUNT;

        // Product-level moderation
        const moderationStatus = await ModerationService.getProductModerationStatus(product.id);
        if (moderationStatus.isDemoted) tradRank += SCORE_WEIGHTS.SHADOW_BAN_PENALTY;
        
        // Seller-level moderation (cascading effect)
        if (seller.moderation?.isDemoted) {
             tradRank += SCORE_WEIGHTS.SHADOW_BAN_PENALTY;
        }
        
        const reportCount = await ModerationService.countUnresolvedReports(product.id);
        tradRank += reportCount * SCORE_WEIGHTS.UNRESOLVED_REPORTS;

        // === STAGE 4: Personalization Engine ===
        if (userId) {
            if (followedSellerIds.includes(seller.id)) tradRank += SCORE_WEIGHTS.HAS_FOLLOW;
            if (wishlistedProductIds.includes(product.id)) tradRank += SCORE_WEIGHTS.IN_WISHLIST;
        }
        
        const sanitizedProduct: { [key: string]: any } = {};
        for (const key in product) {
            const value = product[key as keyof typeof product];
            if (value instanceof Timestamp) {
                sanitizedProduct[key] = value.toDate().toISOString();
            } else {
                sanitizedProduct[key] = value;
            }
        }

        rankedProducts.push({
            ...(sanitizedProduct as Product),
            tradRank,
            isSponsored,
            manufacturerName: seller.shopName,
            manufacturerSlug: seller.slug,
            manufacturerLocation: seller.location,
            leadTime: seller.leadTime,
            moq: seller.moq,
            isVerified: seller.verificationStatus === 'Verified',
            shopId: seller.shopId,
            slug: product.slug,
        });
    }
    
    // === FINAL STAGE: Sorting & Pagination ===
    const sortedProducts = rankedProducts.sort((a, b) => b.tradRank - a.tradRank);
    
    const totalCount = sortedProducts.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

    return {
        products: paginatedProducts,
        totalCount,
        totalPages,
    };
}


/**
 * Determines the content to display for a product category card.
 * This can be a single item or multiple items for a carousel.
 *
 * @param category - The default product category object.
 * @returns A promise that resolves to an array of featured items.
 */
export async function getFeaturedCategoryContent(
    category: ProductCategory
): Promise<{ imageUrl: string; href: string; sellerName?: string; sellerSlug?: string }[]> {
    const adSlots = await SellerService.getAdSlots();
    const slotId = `category-spotlight-${category.id}`;
    const manualOverride = adSlots.find(slot => slot.id === slotId);

    if (manualOverride && manualOverride.pinnedEntities && manualOverride.pinnedEntities.length > 0) {
        const featuredItems = await Promise.all(manualOverride.pinnedEntities.map(async (entity: any) => {
            if (entity.entityType === 'product') {
                const product = await ProductService.getProductById(entity.id);
                if (product) {
                    const seller = await SellerService.getSellerById(product.manufacturerId);
                    return {
                        imageUrl: product.imageUrl,
                        href: `/category/${category.id}`, // Corrected href to point to the category page
                        sellerName: seller?.shopName,
                        sellerSlug: seller?.slug,
                    };
                }
            }
            return null;
        }));
        const validItems = featuredItems.filter(item => item !== null) as { imageUrl: string; href: string; sellerName?: string; sellerSlug?: string }[];
        
        // If there are valid items from the ad slot, return them.
        if (validItems.length > 0) {
            return validItems;
        }
    }
    
    // Fallback logic if no override is found or if pinned items are invalid
    return [{
        imageUrl: category.imageUrl,
        href: `/category/${category.id}`,
    }];
}
