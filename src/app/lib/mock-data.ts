
import type { Product, Order, Campaign, Manufacturer } from './definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const manufacturers: Manufacturer[] = [
    {
        id: 'mfg-1',
        shopId: 'const-ltd',
        slug: 'constructa-ltd',
        name: 'Constructa Ltd',
        logoUrl: 'https://picsum.photos/seed/mfg1/128/128',
        coverImageUrl: 'https://picsum.photos/seed/mfg1-cover/1600/400',
        industry: 'Building Materials',
        location: 'Nairobi, Kenya',
        memberSince: 2022,
        rating: 4.8,
        isVerified: true,
        acceptsTradPay: true,
        overview: 'Constructa Ltd is a leading supplier of high-quality building materials in East Africa. Established in 2010, we are committed to providing durable and reliable products for construction projects of all sizes. Our state-of-the-art facilities ensure consistent quality and supply.',
        certifications: ['KEBS Certified', 'ISO 9001:2015'],
        businessType: 'Manufacturer & Distributor',
        workforceSize: '100 - 200 employees',
        exportMarkets: ['Uganda', 'Tanzania', 'Rwanda'],
        productionCapacity: '10,000 tons/month',
        paymentMethods: ['TradPay', 'Bank Transfer', 'LPO'],
        deliveryTerms: ['FOB Nairobi', 'Door-to-door'],
        leadTime: '5-10 business days',
        moq: 10,
        reviews: [
            {
                id: 'rev-1',
                author: 'BuildRight Const.',
                rating: 5,
                comment: 'Reliable supplier with consistent quality. Our go-to for all major projects.'
            },
            {
                id: 'rev-2',
                author: 'Home Builders Inc.',
                rating: 4,
                comment: 'Good products and fair pricing. Sometimes lead times can be longer than stated.'
            }
        ]
    },
    {
        id: 'mfg-2',
        shopId: 'super-bake',
        name: 'SuperBake Bakery',
        slug: 'superbake-bakery',
        logoUrl: 'https://picsum.photos/seed/mfg2/128/128',
        coverImageUrl: 'https://picsum.photos/seed/mfg2-cover/1600/400',
        industry: 'Food & Beverage',
        location: 'Nakuru, Kenya',
        memberSince: 2023,
        rating: 4.9,
        isVerified: true,
        acceptsTradPay: true,
        overview: 'SuperBake Bakery supplies premium, commercial-grade baking ingredients to businesses across Kenya. Our flour, yeast, and oils are sourced from the finest local farms and processed in our modern facility to guarantee freshness and quality.',
        certifications: ['KEBS Certified', 'HACCP Certified'],
        businessType: 'Manufacturer',
        workforceSize: '50 - 100 employees',
        exportMarkets: ['East Africa'],
        productionCapacity: '5,000 tons/month',
        paymentMethods: ['TradPay', 'M-Pesa', 'Bank Transfer'],
        deliveryTerms: ['FOB Nakuru'],
        leadTime: '3-7 business days',
        moq: 20,
        reviews: [
            {
                id: 'rev-3',
                author: 'Yum Foods',
                rating: 5,
                comment: 'The best quality flour we have found in the market. Highly recommended!'
            }
        ]
    },
    {
        id: 'mfg-3',
        shopId: 'plastico-ke',
        name: 'PlastiCo Kenya',
        slug: 'plastico-kenya',
        logoUrl: 'https://picsum.photos/seed/mfg3/128/128',
        coverImageUrl: 'https://picsum.photos/seed/mfg3-cover/1600/400',
        industry: 'Plastics & Polymers',
        location: 'Mombasa, Kenya',
        memberSince: 2021,
        rating: 4.7,
        isVerified: true,
        acceptsTradPay: false,
        overview: 'PlastiCo Kenya is a major producer of HDPE, LDPE, and PET pellets for various industrial applications. Our coastal location makes us an ideal partner for both local and export markets.',
        certifications: ['ISO 9001:2015', 'NEMA Certified'],
        businessType: 'Manufacturer & Exporter',
        workforceSize: '200+ employees',
        exportMarkets: ['Global'],
        productionCapacity: '20,000 tons/month',
        paymentMethods: ['Bank Transfer', 'Letter of Credit'],
        deliveryTerms: ['FOB Mombasa'],
        leadTime: '14-21 business days',
        moq: 1000,
        reviews: []
    }
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Industrial Grade Cement',
    slug: 'industrial-grade-cement',
    description: 'High-strength Portland cement suitable for all types of construction projects. Available in 50kg bags.',
    price: 650.00,
    stock: 1200,
    category: 'Building Materials',
    imageUrl: PlaceHolderImages.find(p => p.id === 'product1')?.imageUrl || '',
    imageHint: PlaceHolderImages.find(p => p.id === 'product1')?.imageHint || 'construction cement',
    rating: 4.8,
    reviewCount: 150,
    manufacturerId: 'mfg-1'
  },
  {
    id: '2',
    name: 'Commercial Baking Flour',
    slug: 'commercial-baking-flour',
    description: 'Premium quality, all-purpose wheat flour for bakeries and food manufacturers. Sold in 25kg sacks.',
    price: 2200.00,
    stock: 800,
    category: 'Food & Beverage',
    imageUrl: PlaceHolderImages.find(p => p.id === 'product2')?.imageUrl || '',
    imageHint: PlaceHolderImages.find(p => p.id === 'product2')?.imageHint || 'flour sack',
    rating: 4.9,
    reviewCount: 210,
    manufacturerId: 'mfg-2'
  },
  {
    id: '3',
    name: 'HDPE Plastic Pellets',
    slug: 'hdpe-plastic-pellets',
    description: 'High-density polyethylene pellets for injection molding and manufacturing plastic goods. 1-ton bulk bags.',
    price: 135000.00,
    stock: 50,
    category: 'Plastics & Polymers',
    imageUrl: PlaceHolderImages.find(p => p.id === 'product3')?.imageUrl || '',
    imageHint: PlaceHolderImages.find(p => p.id === 'product3')?.imageHint || 'plastic pellets',
    rating: 4.7,
    reviewCount: 85,
    manufacturerId: 'mfg-3'
  },
  {
    id: '4',
    name: 'Recycled Kraft Paper Rolls',
    slug: 'recycled-kraft-paper-rolls',
    description: 'Eco-friendly kraft paper rolls for packaging and printing. Various widths and gsm available.',
    price: 8500.00,
    stock: 300,
    category: 'Packaging',
    imageUrl: PlaceHolderImages.find(p => p.id === 'product4')?.imageUrl || '',
    imageHint: PlaceHolderImages.find(p => p.id === 'product4')?.imageHint || 'paper rolls',
    rating: 4.6,
    reviewCount: 120,
    manufacturerId: 'mfg-1' // Example
  },
  {
    id: '5',
    name: 'Bulk Cooking Oil',
    slug: 'bulk-cooking-oil',
    description: 'Refined sunflower cooking oil supplied in 20-liter jerrycans. Ideal for restaurants and catering businesses.',
    price: 4500.00,
    stock: 500,
    category: 'Food & Beverage',
    imageUrl: PlaceHolderImages.find(p => p.id === 'product5')?.imageUrl || '',
    imageHint: PlaceHolderImages.find(p => p.id === 'product5')?.imageHint || 'cooking oil',
    rating: 4.8,
    reviewCount: 180,
    manufacturerId: 'mfg-2'
  },
   {
    id: '6',
    name: 'Steel Reinforcement Bars (Rebar)',
    slug: 'steel-reinforcement-bars-rebar',
    description: 'High-tensile steel bars for concrete reinforcement, available in various diameters and lengths.',
    price: 75000.00,
    stock: 200,
    category: 'Building Materials',
    imageUrl: 'https://picsum.photos/seed/rebar/600/400',
    imageHint: 'steel rebar',
    rating: 4.9,
    reviewCount: 95,
    manufacturerId: 'mfg-1'
  },
];

export const orders: Order[] = [
  { id: 'ORD-001', productName: 'Industrial Grade Cement', customerName: 'Constructa Ltd', date: '2023-10-26', quantity: 200, total: 130000, status: 'Delivered' },
  { id: 'ORD-002', productName: 'Commercial Baking Flour', customerName: 'SuperBake Bakery', date: '2023-10-25', quantity: 50, total: 110000, status: 'Shipped' },
  { id: 'ORD-003', productName: 'HDPE Plastic Pellets', customerName: 'PlastiCo Kenya', date: '2023-10-25', quantity: 5, total: 675000, status: 'Pending' },
  { id: 'ORD-004', productName: 'Bulk Cooking Oil', customerName: 'Savanna Foods', date: '2023-10-24', quantity: 100, total: 450000, status: 'Delivered' },
  { id: 'ORD-005', productName: 'Recycled Kraft Paper Rolls', customerName: 'PrintPack Solutions', date: '2023-10-23', quantity: 20, total: 170000, status: 'Cancelled' },
];

export const campaigns: Campaign[] = [
    { id: 'CAMP-01', name: 'End of Year Clearance', status: 'Active', startDate: '2023-11-01', endDate: '2023-12-31', budget: 50000, impressions: 120500, clicks: 8230 },
    { id: 'CAMP-02', name: 'New Product Launch: Eco-Pack', status: 'Active', startDate: '2023-10-15', endDate: '2023-11-15', budget: 75000, impressions: 250000, clicks: 15400 },
    { id: 'CAMP-03', name: 'Back to School Special', status: 'Expired', startDate: '2023-08-01', endDate: '2023-08-31', budget: 30000, impressions: 85000, clicks: 4500 },
    { id: 'CAMP-04', name: 'Q1 2024 Planning', status: 'Draft', startDate: '2024-01-01', endDate: '2024-03-31', budget: 100000, impressions: 0, clicks: 0 },
];
