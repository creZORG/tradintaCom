

import { Suspense } from 'react';
import { performSearch } from '@/services/search-service';
import { ProductCard } from '@/components/product-card';
import { type Product, type Manufacturer } from '@/lib/definitions';
import { Loader2, Building, Package } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

// A new card component specifically for displaying manufacturer search results.
const ManufacturerCard = ({ manufacturer }: { manufacturer: Manufacturer }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4 flex items-center gap-4">
      <Image
        src={manufacturer.logoUrl || 'https://i.postimg.cc/j283ydft/image.png'}
        alt={manufacturer.shopName || 'logo'}
        width={64}
        height={64}
        className="rounded-md border"
      />
      <div className="flex-grow">
        <Link href={`/manufacturer/${manufacturer.slug}`} className="font-semibold text-lg hover:text-primary leading-tight">
            {manufacturer.shopName}
        </Link>
        <p className="text-sm text-muted-foreground">{manufacturer.industry}</p>
        {manufacturer.isVerified && (
            <Badge variant="secondary" className="mt-1 flex items-center gap-1 w-fit">
                <ShieldCheck className="w-3 h-3 text-green-600"/> Verified
            </Badge>
        )}
      </div>
    </CardContent>
  </Card>
);

// The main server component for the search results page.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const query = (searchParams?.q as string) || '';
  const { products, manufacturers } = await performSearch(query);

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">
          Search Results
        </h1>
        {query ? (
          <p className="text-muted-foreground">
            Showing results for "{query}"
          </p>
        ) : (
          <p className="text-muted-foreground">Please enter a search term.</p>
        )}
      </div>

      {query ? (
        <div className="space-y-12">
          {/* Products Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" /> Products ({products.length})
            </h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product as any} context="b2b" />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No products found matching your search.</p>
            )}
          </section>

          {/* Manufacturers Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Building className="w-6 h-6 text-primary" /> Manufacturers ({manufacturers.length})
            </h2>
            {manufacturers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {manufacturers.map((manufacturer) => (
                  <ManufacturerCard key={manufacturer.id} manufacturer={manufacturer} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No manufacturers found matching your search.</p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
