import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Search } from 'lucide-react';
import { getBrandingLogos } from '@/app/lib/data';

export default async function NotFound() {
  const { mainLogoUrl } = await getBrandingLogos();
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-background text-center p-4">
      <Logo className="w-48 mb-8" logoUrl={mainLogoUrl} />
      <h1 className="text-6xl font-bold font-headline text-primary mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Sorry, we couldn’t find the page you’re looking for. It might have been moved, deleted, or maybe you just mistyped the URL.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">
            <Search className="mr-2 h-4 w-4" />
            Browse Products
          </Link>
        </Button>
      </div>
    </div>
  );
}
