
import { ProductsPageClient } from './products-page-client';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import { getAuth } from "firebase-admin/auth";
import { cookies } from 'next/headers';
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { PaginatedProducts, SearchOptions } from '@/services/DiscoveryEngine.d';
import type { Metadata } from 'next';

// This is the recommended Next.js way to generate dynamic metadata for a page.
export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
  const query = searchParams?.q as string;
  const category = searchParams?.category as string;
  const tab = searchParams?.tab as string;

  let title = 'B2B Products Marketplace';
  let description = 'Source products directly from verified manufacturers across Africa. Request quotes, compare prices, and manage your B2B supply chain.';

  if (query) {
    title = `Search results for "${query}"`;
    description = `Find the best prices and suppliers for "${query}" on Tradinta's B2B marketplace.`;
  } else if (category && category !== 'all') {
    title = `${category.charAt(0).toUpperCase() + category.slice(1)} | Wholesale & Bulk`;
    description = `Browse wholesale ${category} from top African manufacturers. Get direct factory pricing on Tradinta.`;
  } else if (tab === 'direct') {
    title = 'Tradinta Direct | Quality-Assured B2C Products';
    description = 'Shop a curated selection of products fulfilled directly by Tradinta. Guaranteed quality and fast delivery.';
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}


async function ProductDataFetcher({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const cookieStore = cookies();
  const session = cookieStore.get('session')?.value;
  let userId = null;
  if(session) {
      try {
        const decodedClaims = await getAuth().verifySessionCookie(session, true);
        userId = decodedClaims.uid;
      } catch (error) {
        // console.log("Could not verify session cookie: ", error);
      }
  }
  
  const options: SearchOptions = {
      userId,
      searchQuery: searchParams?.q as string || undefined,
      category: searchParams?.category as string || 'all',
      verifiedOnly: searchParams?.verifiedOnly === 'true',
      minPrice: searchParams?.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams?.maxPrice ? Number(searchParams.maxPrice) : undefined,
      moq: searchParams?.moq ? Number(searchParams.moq) : undefined,
      rating: searchParams?.rating ? Number(searchParams.rating) : undefined,
      page: searchParams?.page ? Number(searchParams.page) : 1,
      limit: 12,
      isDirect: searchParams?.tab === 'direct',
  };

  const initialData = await getRankedProducts(options);

  return <ProductsPageClient initialData={initialData} />;
}


export default function ProductsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ProductDataFetcher searchParams={searchParams} />
    </Suspense>
  );
}
