
import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { getProductCategories, type ProductCategory } from '@/app/lib/data';
import { SignUpForm } from '@/components/signup/SignUpForm';

// Loading skeleton for the form
function SignUpFormSkeleton() {
    return (
        <div className="mx-auto w-full max-w-lg space-y-6">
            <div className="h-10 w-40 bg-muted rounded-md" />
            <div className="h-6 w-3/4 bg-muted rounded-md" />
            <div className="space-y-4 pt-4">
                <div className="h-24 w-full bg-muted rounded-md" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 w-full bg-muted rounded-md" />
                    <div className="h-24 w-full bg-muted rounded-md" />
                </div>
            </div>
            <div className="space-y-4 pt-4">
                <div className="h-10 w-full bg-muted rounded-md" />
                <div className="h-10 w-full bg-muted rounded-md" />
                <div className="h-10 w-full bg-muted rounded-md" />
                <div className="h-10 w-full bg-muted rounded-md" />
            </div>
        </div>
    )
}

// This is the main page component, now a Server Component.
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const refCode = (searchParams?.ref as string) || null;
  const categories = await getProductCategories();

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SignUpFormSkeleton />}>
           <SignUpForm initialRefCode={refCode} categories={categories} />
        </Suspense>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src={'https://picsum.photos/seed/signup-new/1200/1800'}
          alt="Silhouettes of factories and trade routes"
          fill
          className="object-cover"
          data-ai-hint="digital trade web"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-orange-500/20"></div>
      </div>
    </div>
  );
}
