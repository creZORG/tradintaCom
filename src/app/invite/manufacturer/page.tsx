
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart, Package, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a Manufacturer on Tradinta | Sell Your Products B2B',
  description: 'Join Tradinta to get discovered by thousands of verified buyers and distributors. List your products before our massive launch to get a first-mover advantage.',
};


const benefits = [
    {
        icon: <ShieldCheck className="w-8 h-8 text-primary" />,
        title: "Get Verified",
        description: "Earn a 'Verified Manufacturer' badge that builds immediate trust with buyers across the continent."
    },
    {
        icon: <Package className="w-8 h-8 text-primary" />,
        title: "Showcase Your Products",
        description: "Upload your entire catalog to a beautiful, modern storefront that puts your products in the spotlight."
    },
    {
        icon: <BarChart className="w-8 h-8 text-primary" />,
        title: "Access Growth Tools",
        description: "Leverage our analytics, marketing plans, and partner network to scale your business."
    }
]

export default function ManufacturerInvitePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center text-center text-white p-4">
        <Image 
            src="https://picsum.photos/seed/mfg-hero/1800/1200"
            alt="A modern, clean, and active factory floor"
            fill
            className="object-cover -z-10"
            data-ai-hint="modern factory"
            priority
        />
        <div className="absolute inset-0 bg-black/60 -z-10" />
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">
            The Future of African Manufacturing is Digital.
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Tradinta is launching the largest digital trade event in Africa. List your products now to get discovered by thousands of verified buyers and distributors from day one. Don't miss out on the first wave.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup?role=manufacturer">
              Secure Your Spot <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline">Why Join Tradinta Before the Launch?</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Gain a powerful first-mover advantage. Our founding members will be front and center during our massive launch campaign.</p>
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
            <h2 className="text-3xl font-bold font-headline mb-12">Go from Factory to Market in 3 Steps</h2>
            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Dashed lines for larger screens */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-px">
                     <svg width="100%" height="100%"><line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="2" stroke="hsl(var(--border))" strokeDasharray="8, 8"/></svg>
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">1</div>
                    <h3 className="text-xl font-semibold">Register & Verify</h3>
                    <p className="text-muted-foreground mt-1">Create your account and submit your business documents for verification.</p>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">2</div>
                    <h3 className="text-xl font-semibold">Build Your Shop</h3>
                    <p className="text-muted-foreground mt-1">Easily upload your product catalog and set up your digital storefront.</p>
                </div>
                 <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">3</div>
                    <h3 className="text-xl font-semibold">Start Selling</h3>
                    <p className="text-muted-foreground mt-1">Receive orders, respond to quotes, and get paid securely.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Feature Callout Section */}
      <section className="py-16 lg:py-24">
          <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="pr-8">
                  <h2 className="text-3xl font-bold font-headline mb-4">Your Digital Showroom</h2>
                  <p className="text-muted-foreground text-lg mb-6">Your Tradinta storefront is more than just a listing—it's a modern, professional, and customizable hub for your brand. Showcase your entire product line, manage inquiries, and build lasting relationships with buyers, all in one place.</p>
                  <Button asChild>
                      <Link href="/signup?role=manufacturer">Claim Your Storefront</Link>
                  </Button>
              </div>
              <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
                   <Image 
                        src="https://picsum.photos/seed/mfg-feat/800/600"
                        alt="A sleek digital product catalog on a tablet"
                        fill
                        className="object-cover"
                        data-ai-hint="digital product catalog"
                    />
              </div>
          </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto text-center py-20">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            Be Ready for Day One.
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-primary-foreground/80">
            Our launch will put your products in front of a massive audience. Secure your position as a trusted, foundational manufacturer on Tradinta today.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup?role=manufacturer">
              Register Your Business <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
