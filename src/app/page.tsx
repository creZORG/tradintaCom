
'use client';
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Truck,
  BarChart,
  Coins,
  Building,
  Book,
  Handshake,
  UserPlus,
  Factory,
  ShoppingCart,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllBlogPosts } from '@/app/lib/data';
import type { Product, Manufacturer } from '@/lib/definitions';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';
import { ProductCard } from '@/components/product-card';
import { HeroSection } from '@/components/homepage/HeroSection';
import { ComparisonTray } from '@/components/products/comparison-tray';
import { cn } from '@/lib/utils';
import { CategoryScroller } from '@/components/products/category-scroller';
import { useUser } from '@/firebase';
import { logFeatureUsage } from '@/lib/analytics';

const valueHighlights = [
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: 'Verified Manufacturers',
    description: 'Connect with trusted, vetted partners.',
  },
  {
    icon: <Lock className="h-8 w-8 text-primary" />,
    title: 'Secure Payments via TradePay',
    description: 'Transact with confidence using our escrow system.',
    isComingSoon: true,
  },
  {
    icon: <Truck className="h-8 w-8 text-primary" />,
    title: 'Reliable Logistics',
    description: 'Seamless delivery across the continent.',
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: 'Marketing Tools for Growth',
    description: 'Amplify your reach and boost your sales.',
  },
  {
    icon: <Coins className="h-8 w-8 text-primary" />,
    title: 'Powered by TradCoin',
    description: 'Earn rewards and incentives on every transaction.',
  },
];

const joinActions = [
    {
        icon: <Factory className="w-8 h-8 mb-4 text-primary" />,
        title: 'Register as a Manufacturer',
        description: 'List your products, access a continental market, and utilize our growth tools.',
        href: '/signup?role=manufacturer',
    },
    {
        icon: <ShoppingCart className="w-8 h-8 mb-4 text-primary" />,
        title: 'Browse Wholesale Offers',
        description: 'Source quality products directly from verified manufacturers at B2B prices.',
        href: '/products',
    },
    {
        icon: <Building className="w-8 h-8 mb-4 text-primary" />,
        title: 'Become a Distributor',
        description: 'Buy in bulk and supply your local market with quality-assured products.',
        href: '/signup?role=distributor',
    },
    {
        icon: <Handshake className="w-8 h-8 mb-4 text-primary" />,
        title: 'Join as a Growth Partner',
        description: 'Monetize your influence by partnering with brands and earning commissions.',
        href: '/signup?role=partner',
    },
]

export default function HomePage() {
  const [allProducts, setAllProducts] = React.useState<ProductWithRanking[]>([]);
  const [recentBlogPosts, setRecentBlogPosts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user, role } = useUser();

  const directCanvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (user && role) {
        logFeatureUsage({
            feature: 'page:view',
            userId: user.uid,
            userRole: role,
            metadata: { page: '/' }
        });
    }
  }, [user, role]);

  React.useEffect(() => {
    const canvas = directCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const particleColor = 'rgba(41, 171, 226, 0.7)';

    let particles: any[];
    let animationFrameId: number;
    
    const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };

    const createParticles = () => {
        particles = [];
        const numberOfParticles = (canvas.height * canvas.width) / 12000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1.5;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            particles.push({ x, y, directionX, directionY, size });
        }
    };

    const connect = () => {
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                             + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                if (distance < (canvas.width/8) * (canvas.height/8)) {
                    opacityValue = 1 - (distance/20000);
                    ctx.strokeStyle = `rgba(41, 171, 226, ${opacityValue})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    };

    const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];
            particle.x += particle.directionX;
            particle.y += particle.directionY;
            if (particle.x > canvas.width || particle.x < 0) {
                particle.directionX = -particle.directionX;
            }
            if (particle.y > canvas.height || particle.y < 0) {
                particle.directionY = -particle.directionY;
            }
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2, false);
            ctx.fillStyle = particleColor;
            ctx.fill();
        }
        connect();
        animationFrameId = requestAnimationFrame(animate);
    };
    
    resizeCanvas();
    createParticles();
    animate();

    const handleResize = () => {
        resizeCanvas();
        createParticles();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [rankedData, blogData] = await Promise.all([
        getRankedProducts(null),
        getAllBlogPosts()
      ]);
      setAllProducts(rankedData.products);
      setRecentBlogPosts(blogData.slice(0, 3));
      setIsLoading(false);
    }
    loadData();
  }, []);

  const productPool = allProducts.filter(p => p.isSponsored).slice(0, 8);
  const shuffledProducts = productPool.sort(() => 0.5 - Math.random());
  const featuredProducts = shuffledProducts.slice(0, 4);

  const featuredManufacturers = featuredProducts.reduce((acc, product) => {
    if (product.manufacturerId && !acc.find(m => m.id === product.manufacturerId)) {
      acc.push({
        id: product.manufacturerId,
        slug: product.manufacturerSlug || '',
        name: product.manufacturerName || 'Tradinta Seller',
        industry: product.category,
        logo: 'https://picsum.photos/seed/mfg-placeholder/48/48',
      });
    }
    return acc;
  }, [] as { id: string; slug: string; name: string; industry: string; logo: string; }[]).slice(0, 4);


  return (
    <>
      <div className="flex flex-col">
        <HeroSection />
        
        <div className="bg-background">
            <section className="container mx-auto px-4 py-16">
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {valueHighlights.map((highlight) => (
                  <div key={highlight.title} className="flex flex-col items-center text-center gap-2 max-w-[200px]">
                    {React.cloneElement(highlight.icon)}
                    <h3 className="font-bold text-base mt-2 text-foreground">
                        {highlight.title}
                        {highlight.isComingSoon && (
                           <sup className="text-xs italic text-primary/80 ml-1 -top-2">coming soon</sup>
                        )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{highlight.description}</p>
                  </div>
                ))}
              </div>
            </section>
        </div>

        <div className="container mx-auto px-4 pt-8 pb-12">
          <div className="flex flex-col gap-12 md:gap-20">
            
            {/* Featured Categories Section */}
            <section>
              <h2 className="text-3xl font-bold mb-8 text-center font-headline">
                Explore by Category
              </h2>
              <CategoryScroller />
            </section>
            
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold font-headline">Featured Products</h2>
                <Button variant="outline" asChild>
                  <Link href="/products">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />) :
                featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} context="b2b" source="homepage_featured" />
                ))}
              </div>
            </section>
            
            <section className="relative py-12 rounded-xl overflow-hidden bg-background">
                <canvas ref={directCanvasRef} className="absolute inset-0 w-full h-full opacity-30 z-0"></canvas>
                <div className="relative container mx-auto text-center z-10">
                    <h2 className="text-3xl font-bold font-headline mb-3">Tradinta Direct</h2>
                    <p className="max-w-2xl mx-auto text-muted-foreground mb-8">
                       Shop with Confidence. Products on Tradinta Direct are stored, verified, and shipped directly from our warehouse to you. Guaranteed quality and faster delivery.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 w-full bg-white/10" />) :
                    allProducts.filter(p => p.listOnTradintaDirect).slice(0,4).map((product) => (
                        <ProductCard key={product.id} product={product as any} context="b2c" source="homepage_direct" />
                    ))}
                    </div>
                     <div className="mt-8">
                        <Button variant="secondary" asChild>
                            <Link href="/products?tab=direct">
                                Shop All Direct Products <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* 4. Manufacturer Spotlight */}
            <section className="bg-muted/30 py-12 rounded-lg -mx-4 px-4">
              <div className="container mx-auto">
                  <h2 className="text-3xl font-bold mb-8 text-center font-headline">Featured Manufacturers</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      {featuredManufacturers.map(mfg => (
                          <div key={mfg.name} className="flex flex-col items-center text-center gap-4">
                              <Image src={mfg.logo} alt={mfg.name} width={64} height={64} className="rounded-full" />
                              <div>
                                  <h4 className="font-semibold">{mfg.name}</h4>
                                  <p className="text-sm text-muted-foreground">{mfg.industry}</p>
                              </div>
                              <Button variant="outline" size="sm" asChild><Link href={`/manufacturer/${mfg.slug}`}>View Shop</Link></Button>
                          </div>
                      ))}
                  </div>
              </div>
            </section>

            {/* 5. About Tradinta */}
            <section className="text-center max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 font-headline">About Tradinta</h2>
              <p className="text-muted-foreground mb-4">
                  Tradinta is Kenya’s first B2B marketplace built exclusively for manufacturers. We help factories, wholesalers, and retailers connect, transact, and grow using digital tools built for Africa’s supply chain.
              </p>
              <Button variant="link" asChild>
                  <Link href="/pages/about-us">Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </section>

            {/* News & Insights */}
             <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold font-headline">News & Insights</h2>
                <Button variant="outline" asChild>
                  <Link href="/blog">
                    Read All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentBlogPosts && recentBlogPosts.length > 0 ? (
                  recentBlogPosts.map(post => (
                    <Card key={post.id}>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                        <Button variant="link" asChild className="p-0"><Link href={`/blog/${post.slug}`}>Read More</Link></Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="md:col-span-3 text-center text-muted-foreground py-8">
                    <Book className="mx-auto h-12 w-12 mb-4" />
                    <p>No news articles published yet. Check back soon!</p>
                  </div>
                )}
              </div>
            </section>


            {/* 6. TradePay & TradCoin Promo */}
            <section className="grid md:grid-cols-2 gap-8 items-center">
              <Card className="p-8 text-center bg-primary text-primary-foreground">
                  <h3 className="text-2xl font-bold mb-2 font-headline">TradePay</h3>
                  <p className="text-primary-foreground/80 mb-4">
                      Secure, instant payments with escrow protection.
                  </p>
                  <Button variant="secondary" asChild><Link href="/tradepay/about">Try TradePay</Link></Button>
              </Card>
              <Card className="p-8 text-center bg-card text-card-foreground border">
                  <h3 className="text-2xl font-bold mb-2 font-headline">TradCoin</h3>
                  <p className="text-muted-foreground mb-4">
                      Earn, trade, and save with Africa’s first manufacturing token.
                  </p>
                  <Button variant="outline">Learn About TradCoin</Button>
              </Card>
            </section>

            {/* 7. Call-to-Action Grid */}
            <section className="bg-muted/30 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-center">Join hundreds of businesses growing with Tradinta.</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {joinActions.map((action) => (
                        <Card key={action.title} className="hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <CardContent className="p-6 text-center flex flex-col items-center">
                                {action.icon}
                                <h3 className="font-semibold text-lg">{action.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-4 flex-grow">{action.description}</p>
                                <Button asChild>
                                    <Link href={action.href}>
                                        Get Started <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
          </div>
        </div>
        <ComparisonTray />
      </div>
    </>
  );
}
