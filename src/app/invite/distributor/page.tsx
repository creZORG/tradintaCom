
import { Button } from "@/components/ui/button";
import { ArrowRight, Boxes, ShoppingCart, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from 'next';
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: 'Become a Tradinta Distributor | Source Wholesale Products',
  description: 'Join Tradinta as a verified distributor to gain direct access to a continental network of manufacturers. Source quality products at scale and power your retail business.',
};


const benefits = [
    {
        icon: <ShoppingCart className="w-8 h-8 text-primary" />,
        title: "Access Exclusive B2B Pricing",
        description: "Source products in bulk directly from manufacturers at wholesale prices unavailable to the general public."
    },
    {
        icon: <Boxes className="w-8 h-8 text-primary" />,
        title: "Expand Your Catalog",
        description: "Discover new, high-quality products from verified sellers across Africa to diversify your inventory."
    },
    {
        icon: <TrendingUp className="w-8 h-8 text-primary" />,
        title: "Scale Your Retail Business",
        description: "Leverage our platform to streamline your procurement, manage inventory, and grow your resale network."
    }
]

export default function DistributorInvitePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center text-center text-white p-4">
        <Image 
            src="https://picsum.photos/seed/dist-hero/1800/1200"
            alt="A modern warehouse with neatly stacked boxes"
            fill
            className="object-cover -z-10"
            data-ai-hint="modern warehouse"
            priority
        />
        <div className="absolute inset-0 bg-black/50 -z-10" />
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">
            Become a Key Link in Africa's Supply Chain.
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Join Tradinta as a verified distributor and gain direct access to a continental network of manufacturers. Source quality products at scale and power your retail business like never before.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup?role=distributor">
              Register as a Distributor <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Benefits Section */}
       <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline">Why Join as a Distributor?</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Get the tools and access you need to stay ahead in a competitive market.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        {benefit.icon}
                    </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-headline mb-12">Get Started in 3 Simple Steps</h2>
            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Dashed lines for larger screens */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-px">
                     <svg width="100%" height="100%"><line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="2" stroke="hsl(var(--border))" strokeDasharray="8, 8"/></svg>
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">1</div>
                    <h3 className="text-xl font-semibold">Create Your Account</h3>
                    <p className="text-muted-foreground mt-1">Sign up as a distributor and tell us about your business.</p>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">2</div>
                    <h3 className="text-xl font-semibold">Source & Procure</h3>
                    <p className="text-muted-foreground mt-1">Browse our exclusive B2B marketplace and place bulk orders.</p>
                </div>
                 <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">3</div>
                    <h3 className="text-xl font-semibold">Grow Your Network</h3>
                    <p className="text-muted-foreground mt-1">Manage inventory, fulfill orders, and scale your distribution business.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Feature Callout Section */}
      <section className="py-16 lg:py-24">
          <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="pr-8">
                  <Badge>Powerful Tools</Badge>
                  <h2 className="text-3xl font-bold font-headline mt-4 mb-4">Streamlined Bulk Ordering</h2>
                  <p className="text-muted-foreground text-lg mb-6">Our platform makes it easy to request quotations, negotiate terms, and place large-volume orders from multiple manufacturers at once. Track everything from a single dashboard.</p>
                  <Button asChild>
                      <Link href="/products">Browse Products</Link>
                  </Button>
              </div>
              <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
                   <Image 
                        src="https://picsum.photos/seed/dist-feat/800/600"
                        alt="A user managing a bulk order on a tablet"
                        fill
                        className="object-cover"
                        data-ai-hint="bulk order interface"
                    />
              </div>
          </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto text-center py-20">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            Ready to Redefine Distribution?
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-primary-foreground/80">
            Secure your spot as a foundational distributor on Africa's fastest-growing B2B trade network.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup?role=distributor">
              Start Your Application <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
