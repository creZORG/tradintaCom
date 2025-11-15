
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart, Handshake, DollarSign } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tradinta Growth Partner Program | Monetize Your Influence',
  description: 'Join the Tradinta Growth Partner program to turn your influence into income. Connect your audience with quality African manufacturers and earn commissions on every sale.',
};

const benefits = [
    {
        icon: <Handshake className="w-8 h-8 text-primary" />,
        title: "Connect with Brands",
        description: "Gain access to a network of top African manufacturers looking for authentic voices to represent their products."
    },
    {
        icon: <DollarSign className="w-8 h-8 text-primary" />,
        title: "Monetize Your Influence",
        description: "Earn commissions on every sale you drive through your unique referral links and promotional codes."
    },
    {
        icon: <BarChart className="w-8 h-8 text-primary" />,
        title: "Track Your Impact",
        description: "Our dashboard gives you real-time analytics on your clicks, sign-ups, and sales conversions."
    }
]

export default function PartnerInvitePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center text-center text-white p-4">
        <Image 
            src="https://picsum.photos/seed/partner-hero/1800/1200"
            alt="A content creator filming with professional gear"
            fill
            className="object-cover -z-10"
            data-ai-hint="influencer content creation"
            priority
        />
        <div className="absolute inset-0 bg-black/50 -z-10" />
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">
            Partner with Africa's Industrial Leaders.
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Are you a content creator, influencer, or industry expert? Join the Tradinta Growth Partner program and turn your influence into income by connecting your audience with quality African manufacturers.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup?role=partner">
              Become a Growth Partner <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Benefits Section */}
       <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline">A Partnership Built for Growth</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">We provide the tools, you provide the influence. Let's grow together.</p>
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
            <h2 className="text-3xl font-bold font-headline mb-12">Start Earning in 3 Steps</h2>
            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Dashed lines for larger screens */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-px">
                     <svg width="100%" height="100%"><line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="2" stroke="hsl(var(--border))" strokeDasharray="8, 8"/></svg>
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">1</div>
                    <h3 className="text-xl font-semibold">Join the Program</h3>
                    <p className="text-muted-foreground mt-1">Sign up as a Growth Partner and set up your public profile.</p>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">2</div>
                    <h3 className="text-xl font-semibold">Share & Promote</h3>
                    <p className="text-muted-foreground mt-1">Use your unique links to promote manufacturers and their products.</p>
                </div>
                 <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mb-4">3</div>
                    <h3 className="text-xl font-semibold">Get Paid</h3>
                    <p className="text-muted-foreground mt-1">Earn commissions on every sale you generate and get paid via TradePay.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Feature Callout Section */}
      <section className="py-16 lg:py-24">
          <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="pr-8">
                  <h2 className="text-3xl font-bold font-headline mb-4">Your Performance, Your Dashboard</h2>
                  <p className="text-muted-foreground text-lg mb-6">Our partner dashboard gives you a clear, real-time view of your performance. Track clicks, sign-ups, and sales attributed to you. Understand your audience and optimize your strategy for maximum earnings.</p>
                  <Button asChild>
                      <Link href="/signup?role=partner">Get Started</Link>
                  </Button>
              </div>
              <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
                   <Image 
                        src="https://picsum.photos/seed/partner-feat/800/600"
                        alt="A modern analytics dashboard showing graphs and earnings"
                        fill
                        className="object-cover"
                        data-ai-hint="analytics dashboard"
                    />
              </div>
          </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto text-center py-20">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            Amplify Your Influence.
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-primary-foreground/80">
            Be part of a movement to empower African industry. Join our Growth Partner program and be a key player in the continent's industrial revolution.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup?role=partner">
              Apply to Join <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
