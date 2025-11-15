

import {
  Wallet,
  QrCode,
  Globe,
  Smartphone,
  Send,
  Users,
  Repeat,
  Share2,
  Banknote,
  ShieldCheck,
  TrendingUp,
  FileText,
  DollarSign,
  Briefcase,
  Factory,
  ArrowRight,
  Landmark,
  PiggyBank,
  Sparkles,
  Cog,
  Zap,
  Building,
  Rocket,
  Gem,
  Crown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';

const featureLayers = [
  {
    layer: 1,
    title: 'Core Transaction Layer (Payments 2.0)',
    description:
      'These features make TradPay fast, secure, and flexible for every user level — from local kiosks to international B2B exporters.',
    icon: <Wallet className="h-8 w-8" />,
    features: [
      {
        category: 'Instant Wallet Transfers',
        description: 'Send money P2P instantly, even across countries with mobile number or TradID',
        impact: 'Beat delays of bank-based transfers',
      },
      {
        category: 'QR Code Payments',
        description: 'Universal QR codes for online checkout, warehouses, and agent pickup',
        impact: 'Seamless in-person + digital integration',
      },
      {
        category: 'Multi-Currency Wallet',
        description: 'Auto FX conversion (KES, NGN, ZAR, USD, etc.) at live interbank rates',
        impact: 'Enables borderless trade',
      },
      {
        category: 'Offline Mode',
        description: 'USSD or SMS-based TradPay Lite for non-smartphone users',
        impact: 'Rural accessibility',
      },
      {
        category: 'Request to Pay',
        description: 'Sellers can request payment that buyers confirm with one tap',
        impact: 'Streamlined invoicing flow',
      },
      {
        category: 'Bill Splitting / Group Pay',
        description: 'Buyers can co-finance B2B purchases',
        impact: 'Unlocks MOQ-based orders for small retailers',
      },
      {
        category: 'Recurring Payments',
        description: 'For suppliers, rent, or subscriptions',
        impact: 'Predictable business cashflow',
      },
      {
        category: 'Smart Checkout API',
        description: 'For Tradinta + external sites',
        impact: 'Expands use beyond the platform',
      },
    ],
  },
  {
    layer: 2,
    title: 'Capital & Credit Layer ("TradFinance")',
    description: 'TradPay’s credit engine turns transaction history into opportunity.',
    icon: <Landmark className="h-8 w-8" />,
    features: [
      {
        category: 'TradScore™',
        description: 'AI-driven score based on transaction, order history, review consistency',
        impact: 'Builds trust + creditworthiness',
      },
      {
        category: 'TradPay Credit (Float)',
        description: 'Instant micro-loans or working capital for verified buyers/sellers',
        impact: 'Boosts trade liquidity',
      },
      {
        category: 'Supply Chain Financing',
        description: 'Large buyers “vouch” for smaller suppliers; TradPay advances funds',
        impact: 'Enables trust-based scaling',
      },
      {
        category: 'Invoice Financing',
        description: 'Convert unpaid invoices into instant liquidity',
        impact: 'Keeps cashflow steady',
      },
      {
        category: 'Revenue-based Repayments',
        description: 'Loans auto-repay from wallet top-ups or incoming payments',
        impact: 'Zero-stress loan management',
      },
      {
        category: 'TradGuarantee™',
        description: 'TradPay holds payment in escrow until delivery verified',
        impact: 'Builds reliability in B2B transactions',
      },
    ],
  },
  {
    layer: 3,
    title: 'Savings, Earnings & Yield Layer',
    description: 'Encourages businesses to keep their funds inside the ecosystem.',
    icon: <PiggyBank className="h-8 w-8" />,
    features: [
      {
        category: 'Yield Wallet',
        description: 'Earn small interest or TradPoints yield for stored funds',
        impact: 'Retention of liquidity',
      },
      {
        category: 'TradPoints to Wallet',
        description: 'Convert TradPoints (earned from activity) into KES or credit',
        impact: 'Incentivizes engagement',
      },
      {
        category: 'Round-Up Savings',
        description: 'Automatically save spare change from transactions',
        impact: 'Smart micro-savings',
      },
      {
        category: 'Crowdfunded Investment Pools',
        description: 'SMEs can fund small factories or shared infrastructure',
        impact: 'Democratized industrial financing',
      },
    ],
  },
  {
    layer: 4,
    title: 'Business Operations Layer',
    description: 'TradPay becomes the heartbeat of Tradinta business accounts.',
    icon: <Briefcase className="h-8 w-8" />,
    features: [
      {
        category: 'Payroll Hub',
        description: 'Pay employees directly from wallet to M-Pesa/TradPay',
        impact: 'Simplifies salary disbursement',
      },
      {
        category: 'Supplier Payments',
        description: 'Pay vendors even if they’re off-platform',
        impact: 'Extends reach beyond Tradinta',
      },
      {
        category: 'Invoice Management',
        description: 'Auto-generate, send & track invoices',
        impact: 'Replaces manual accounting',
      },
      {
        category: 'Expense Tracking',
        description: 'Tag transactions by category for instant reports',
        impact: 'Light ERP integration',
      },
      {
        category: 'Financial Dashboard',
        description: 'Real-time insights on cash flow, expenses, loans',
        impact: 'Replaces Excel or QuickBooks',
      },
      {
        category: 'Tax Integration (KRA API)',
        description: 'Auto-generate VAT or withholding summaries',
        impact: 'SME-friendly compliance',
      },
    ],
  },
  {
    layer: 5,
    title: 'Growth & Integration Layer',
    description: 'Connects TradPay to partners, agents, and logistics — creating an entire economic web.',
    icon: <Rocket className="h-8 w-8" />,
    features: [
      {
        category: 'Instant Payouts for Partners',
        description: 'Pay Growth Partners the moment sales confirm',
        impact: 'Trust & motivation',
      },
      {
        category: 'TradLogistics Payments',
        description: 'Pay shipping or insurance directly from TradPay',
        impact: 'Unified checkout for trade',
      },
      {
        category: 'TradAPI for Developers',
        description: 'Open APIs for ERP, POS, or app integration',
        impact: 'Ecosystem expansion',
      },
      {
        category: 'Agent Network ("TradAgents")',
        description: 'Physical cash-in/out agents across Africa',
        impact: 'Offline inclusion',
      },
      {
        category: 'Virtual Cards (Mastercard / Visa)',
        description: 'Digital card linked to wallet',
        impact: 'Online and global payments',
      },
      {
        category: 'Web3-Ready Infrastructure',
        description: 'Tokenized transactions ledger for auditability',
        impact: 'Transparency & future-proofing',
      },
    ],
  },
  {
    layer: 6,
    title: 'Intelligence & Automation Layer',
    description: 'This makes TradPay “smart,” not just functional.',
    icon: <Sparkles className="h-8 w-8" />,
    features: [
      { feature: 'AI Fraud Detection', function: 'Real-time risk scoring for suspicious transactions' },
      { feature: 'Smart Reconciliation', function: 'Auto-match payments to invoices' },
      { feature: 'Predictive Cashflow Insights', function: 'Alerts when cash levels may fall below supplier needs' },
      { feature: 'Credit Simulation Tool', function: 'Users can simulate how TradScore or loan limits change' },
      { feature: 'Behavior-based Rewards', function: 'Reward consistent activity, timely payments, and verified deliveries' },
    ],
  },
  {
    layer: 7,
    title: 'Global Compatibility',
    description: 'Connecting African businesses to the world.',
    icon: <Globe className="h-8 w-8" />,
    features: [
      { feature: 'SEPA / SWIFT Gateway', function: 'Support for international wires' },
      { feature: 'Crypto On/Off Ramp (Licensed)', function: 'Optional integration for global remittance or stablecoin payments' },
      { feature: 'TradPay for Diaspora', function: 'Allow diaspora investors to directly fund verified local businesses on Tradinta' },
      { feature: 'TradWallet ID', function: 'Universal payment identity (email / phone / TradID)' },
      { feature: 'Instant FX Matching', function: 'Peer-to-peer foreign exchange network between users' },
    ],
  },
];

export default function TradPayAboutPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-accent/90 dark:bg-accent/30 py-20 lg:py-32">
        <div className="container mx-auto text-center">
          <Image src="https://i.postimg.cc/xjZhmYGD/image-Photoroom-1-Photoroom.png" alt="TradPay Logomark" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 text-accent-foreground">
            Introducing TradPay
          </h1>
          <p className="text-lg md:text-xl text-accent-foreground/80 max-w-3xl mx-auto mb-8">
            More than just a payment system, TradPay is the financial engine for Africa's manufacturing ecosystem. Secure escrow, instant credit, and powerful business tools, all in one place.
          </p>
          <Button size="lg" asChild>
            <Link href="/tradpay/coming-soon">Join The Waitlist</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto space-y-16">
          {featureLayers.map((layer) => (
            <div key={layer.layer}>
              <div className="text-center mb-12">
                <div className="inline-block p-4 bg-primary/10 rounded-full text-primary mb-4">
                  {layer.icon}
                </div>
                <h2 className="text-3xl font-bold font-headline">
                  <span className="text-primary">Layer {layer.layer}:</span> {layer.title}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
                  {layer.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {layer.features.map((feature, index) => (
                  <Card key={index} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {'category' in feature ? feature.category : feature.feature}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">
                        {'description' in feature ? feature.description : feature.function}
                      </p>
                    </CardContent>
                    {'impact' in feature && (
                      <CardFooter>
                        <Badge variant="secondary">{feature.impact}</Badge>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto text-center py-20">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            Ready to Supercharge Your Business?
          </h2>
          <p className="text-lg max-w-3xl mx-auto mb-8 text-primary-foreground/80">
            Join Tradinta today to access the full power of TradPay. Secure your transactions, unlock capital, and streamline your operations.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">
              Sign Up Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
