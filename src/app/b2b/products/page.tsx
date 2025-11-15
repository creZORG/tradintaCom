
import { ProductsPageClient } from '@/app/products/products-page-client';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import { getAuth } from "firebase-admin/auth";
import { cookies } from 'next/headers';
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';


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
  
  const initialProducts = await getRankedProducts(userId);
  const initialCategory = searchParams?.category as string || 'all';

  return <ProductsPageClient initialProducts={initialProducts} initialCategory={initialCategory} initialTab="for-you" />;
}


export default function B2BProductsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ProductDataFetcher searchParams={searchParams} />
    </Suspense>
  );
}
