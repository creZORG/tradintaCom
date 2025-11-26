
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { SupportWidget } from '@/components/support-widget';
import { SuperAdminSidebar } from '@/components/super-admin-sidebar';
import { ReferralHandler } from '@/components/referral-handler';
import { getBrandingLogos } from '@/app/lib/data';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { TopNav } from '@/components/top-nav';

const BASE_URL = 'https://www.tradinta.com';

export const metadata: Metadata = {
  title: {
    default: 'Tradinta | The B2B Marketplace for African Manufacturers',
    template: '%s | Tradinta',
  },
  description: 'Powering Africa’s Manufacturers Through Digital Trade. Source products directly from verified factories, request quotes, and manage your B2B supply chain with Tradinta.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    description: 'Powering Africa’s Manufacturers Through Digital Trade.',
    url: BASE_URL,
    siteName: 'Tradinta',
    images: [
      {
        url: 'https://i.postimg.cc/mD8zJgVf/tradinta-og-image.png', // Must be an absolute URL
        width: 1200,
        height: 630,
        alt: 'Tradinta Logo and Tagline',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    description: 'Powering Africa’s Manufacturers Through Digital Trade.',
    images: ['https://i.postimg.cc/mD8zJgVf/tradinta-og-image.png'], // Must be an absolute URL
  },
  icons: {
    icon: 'https://res.cloudinary.com/dlmvoo4fj/image/upload/v1763113614/ybfdmvcyfjrdhdghnxrx.png',
  },
  alternates: {
    canonical: '/',
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const { wordmarkUrl, logomarkUrl } = await getBrandingLogos();

  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tradinta',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <meta name="google-site-verification" content="eluJ0qsssEHTafczlwG5h5TAUa1kRaPcrLVpE00H0ss" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LRNT69BG3E"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LRNT69BG3E');
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
          <FirebaseClientProvider>
            <ErrorBoundary>
              <Suspense>
                <ReferralHandler />
              </Suspense>
              <div className="flex flex-col min-h-screen">
                <Suspense fallback={<div className="h-16" />}>
                  <TopNav wordmarkUrl={wordmarkUrl} logomarkUrl={logomarkUrl} />
                </Suspense>
                <SuperAdminSidebar />
                  <main className="flex-grow">
                     <div className="container mx-auto px-4">
                        {children}
                      </div>
                  </main>
                <Toaster />
                <footer className="bg-muted/30 dark:bg-muted/20 border-t py-12">
                  <div className="container mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
                      <div className="col-span-2 md:col-span-2">
                        <Suspense fallback={<div className="h-10 w-32 bg-muted rounded-md" />}>
                          <Logo use="wordmark" className="w-32 h-10" wordmarkUrl={wordmarkUrl} />
                        </Suspense>
                        <p className="text-muted-foreground mt-3 text-sm max-w-xs">
                          Powering Africa’s manufacturers through digital trade, secure payments, and data-driven growth.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Company</h4>
                        <ul className="space-y-2 text-sm">
                          <li><Link href="/pages/about-us" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                          <li><Link href="/blog" className="text-muted-foreground hover:text-primary">Insights</Link></li>
                          <li><Link href="/careers" className="text-muted-foreground hover:text-primary">Careers</Link></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Legal</h4>
                        <ul className="space-y-2 text-sm">
                          <li><Link href="/pages/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                          <li><Link href="/pages/terms-of-service" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                          <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact</Link></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Resources</h4>
                        <ul className="space-y-2 text-sm">
                          <li><Link href="/dashboards/support" className="text-muted-foreground hover:text-primary">Support Center</Link></li>
                          <li><Link href="/marketing-plans" className="text-muted-foreground hover:text-primary">Marketing Plans</Link></li>
                          <li><Link href="/tradepay/about" className="text-muted-foreground hover:text-primary">About Tradepay</Link></li>
                        </ul>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-6 text-sm text-muted-foreground">
                      <p>© {new Date().getFullYear()} Tradinta Inc. All rights reserved.</p>
                      <div className="flex items-center gap-4 mt-4 sm:mt-0">
                          <Link href="#" className="hover:text-primary"><Linkedin className="h-5 w-5"/></Link>
                          <Link href="#" className="hover:text-primary"><Twitter className="h-5 w-5"/></Link>
                          <Link href="#" className="hover:text-primary"><Youtube className="h-5 w-5"/></Link>
                          <Link href="#" className="hover:text-primary"><Instagram className="h-5 w-5"/></Link>
                      </div>
                    </div>
                  </div>
                </footer>
                <SupportWidget />
              </div>
            </ErrorBoundary>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
