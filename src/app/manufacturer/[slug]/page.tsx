
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  Truck,
  MessageSquare,
  Globe,
  Banknote,
  FileText,
  AlertTriangle,
  Facebook,
  Instagram,
  Twitter,
  Phone,
  Mail,
  Calendar,
  Building2,
  Percent,
  Clock,
  Archive,
  Users,
  MapPin,
  Heart,
  Flag,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit, getDocs, doc, orderBy, getCountFromServer } from 'firebase/firestore';
import { type Product, type Manufacturer, type Review } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, differenceInYears, format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FollowButton } from '@/components/follow-button';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/product-card';
import { VerifiedSeal } from '@/components/verified-seal';
import { ContactManufacturerModal } from '@/components/contact-manufacturer-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportModal } from '@/components/report-modal';
import { logProfileView, logTrafficSource } from '@/services/interaction-service';
import { getTrafficSource } from '@/lib/traffic-source';
import Head from 'next/head';


const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
        <div className="text-primary">{icon}</div>
        <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
);

const ReviewCard = ({ review, manufacturerSlug }: { review: Review, manufacturerSlug: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={review.buyerAvatar} />
          <AvatarFallback>{review.buyerName?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{review.buyerName}</p>
          <div className="flex items-center gap-1">
             {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
          </div>
        </div>
      </div>
       <p className="text-xs text-muted-foreground pl-11 mb-1">
        Reviewed:{' '}
        <Link href={`/products/${manufacturerSlug}/${review.productId}`} className="font-semibold hover:underline text-primary">
          {review.productName}
        </Link>
      </p>
      <p className="text-sm text-muted-foreground italic pl-11">"{review.comment}"</p>
      <p className="text-xs text-muted-foreground mt-2 pl-11">{new Date(review.createdAt.seconds * 1000).toLocaleDateString()}</p>
    </CardContent>
  </Card>
);


export default function ManufacturerPage() {
  const slug = useParams().slug as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const [manufacturer, setManufacturer] = React.useState<Manufacturer | null>(null);
  const [followerCount, setFollowerCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingFollowers, setIsLoadingFollowers] = React.useState(true);


  React.useEffect(() => {
    if (!firestore || !slug) return;
    const fetchManufacturer = async () => {
      setIsLoading(true);
      const manufQuery = query(collection(firestore, 'manufacturers'), where('slug', '==', slug), limit(1));
      const querySnapshot = await getDocs(manufQuery);
      if (querySnapshot.empty) {
        setManufacturer(null);
      } else {
        const docSnap = querySnapshot.docs[0];
        const manufData = { id: docSnap.id, ...docSnap.data() } as Manufacturer;
        setManufacturer(manufData);

        logProfileView(manufData.id, user?.uid);
        
        // Log traffic source
        const trafficSource = getTrafficSource(document.referrer);
        logTrafficSource(manufData.id, trafficSource);
        
        setIsLoadingFollowers(true);
        const followersCol = collection(firestore, `manufacturers/${docSnap.id}/followers`);
        getCountFromServer(followersCol).then(snapshot => {
            setFollowerCount(snapshot.data().count);
            setIsLoadingFollowers(false);
        });
      }
      setIsLoading(false);
    };
    fetchManufacturer();
  }, [firestore, slug, user]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !manufacturer) return null;
    return query(collection(firestore, 'manufacturers', manufacturer.id, 'products'), where('status', '==', 'published'));
  }, [firestore, manufacturer]);

  const { data: manufacturerProducts, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

   const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !manufacturer) return null;
    return query(
        collection(firestore, 'reviews'), 
        where('manufacturerId', '==', manufacturer.id), 
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(7)
    );
  }, [firestore, manufacturer]);
  const { data: reviews, isLoading: isLoadingReviews } = useCollection<Review>(reviewsQuery);

  // SEO TITLE
  React.useEffect(() => {
    if (manufacturer) {
        document.title = `${manufacturer.shopName} - Manufacturer on Tradinta`;
    }
  }, [manufacturer]);


  if (isLoading) {
    return (
        <div className="bg-background">
            <div className="container mx-auto px-4 py-12">
                <Skeleton className="h-6 w-1/3 mb-12" />
                <div className="grid md:grid-cols-3 items-center gap-8 mb-12">
                    <div className="md:col-span-2 space-y-4">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-1/2" />
                    </div>
                    <div className="flex justify-center md:justify-end">
                        <Skeleton className="h-32 w-32 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
  }

  if (!manufacturer) {
    notFound();
  }
  
  const isSuspended = manufacturer.suspensionDetails?.isSuspended;
  const showDisclaimer = manufacturer.suspensionDetails?.publicDisclaimer;
  
  let yearsOnTradinta: string | number = 'New';
  if (manufacturer.registrationDate) {
    const years = differenceInYears(new Date(), manufacturer.registrationDate.toDate());
    yearsOnTradinta = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : 'New';
  }
  
  return (
    <div className={cn('bg-background dark:bg-gray-900', manufacturer.theme)}>
      {/* Header Section */}
      <section className="relative min-h-[50vh] flex items-end pb-12 bg-muted/20">
        <div className="absolute inset-0">
          {(manufacturer as any).coverImageUrl && (
                <Image
                    src={(manufacturer as any).coverImageUrl}
                    alt={`${manufacturer.shopName} cover image`}
                    fill
                    className="object-cover opacity-20"
                />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-start gap-6">
                {manufacturer.logoUrl ? (
                    <div className="relative w-32 h-32 rounded-full border-4 border-background shadow-lg -mt-24 flex-shrink-0">
                        <Image
                            src={manufacturer.logoUrl}
                            alt={`${manufacturer.shopName} logo`}
                            fill
                            className="rounded-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-lg -mt-24 flex-shrink-0">
                        <Building2 className="w-16 h-16 text-muted-foreground" />
                    </div>
                )}
                <div className="flex-grow pt-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold font-headline">{manufacturer.shopName}</h1>
                        {manufacturer.isVerified && <VerifiedSeal size={24} />}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span><span className="font-bold text-foreground">{manufacturer.rating || 'N/A'}</span> ({reviews?.length || 0} Reviews)</span>
                        </div>
                        <span className="text-gray-400">|</span>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {isLoadingFollowers ? <Skeleton className="h-4 w-16" /> : <span>{followerCount.toLocaleString()} Followers</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start pt-4 md:self-center shrink-0">
                    <FollowButton targetId={manufacturer.id} targetType="manufacturer" />
                    <Button asChild variant="outline">
                      <a href={`mailto:${manufacturer.contactEmail || manufacturer.email}`}>
                            <Mail className="mr-2 h-4 w-4"/> Contact
                        </a>
                    </Button>
                    <ReportModal reportType="Shop" referenceId={manufacturer.id}>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Flag className="h-4 w-4" />
                        </Button>
                    </ReportModal>
                </div>
            </div>
          </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        
        {isSuspended && showDisclaimer && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Shop Suspended</AlertTitle>
            <AlertDescription>
              This shop's activities are currently restricted due to a violation of platform policies.
            </AlertDescription>
          </Alert>
        )}
        
        {/* --- Stats Section --- */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <StatCard title="Total Products" value={manufacturerProducts?.length || 0} icon={<Archive className="w-6 h-6" />} />
            <StatCard title="Response Rate" value="98%" icon={<Percent className="w-6 h-6" />} />
            <StatCard title="On-time Delivery" value="95%" icon={<Clock className="w-6 h-6" />} />
            <StatCard title="On Tradinta" value={yearsOnTradinta} icon={<Calendar className="w-6 h-6" />} />
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Globe className="w-5 h-5 text-muted-foreground mt-1"/>
                            <div>
                                <p className="text-xs text-muted-foreground">Website</p>
                                <p className="text-sm font-semibold">{manufacturer.website || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-muted-foreground mt-1"/>
                            <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="text-sm font-semibold">{manufacturer.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground mt-1"/>
                            <div>
                                <p className="text-xs text-muted-foreground">Address</p>
                                <p className="text-sm font-semibold">{manufacturer.address}</p>
                            </div>
                        </div>
                    </CardContent>
                    {isSuspended && (
                        <CardFooter>
                            <Badge variant="destructive" className="w-full justify-center gap-2 py-2"><AlertTriangle className="w-4 h-4"/> 1 Issue</Badge>
                        </CardFooter>
                    )}
                </Card>
            </div>
            {/* Right Column */}
            <div className="lg:col-span-2">
                <Tabs defaultValue="profile">
                    <TabsList>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="products">Products</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        <TabsTrigger value="gallery">Gallery</TabsTrigger>
                        <TabsTrigger value="certifications">Certifications</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>About {manufacturer.shopName}</CardTitle></CardHeader>
                            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                                <p>{manufacturer.overview}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="products" className="mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {isLoadingProducts ? (
                                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)
                            ) : manufacturerProducts && manufacturerProducts.length > 0 ? (
                                manufacturerProducts.map((product: any) => (
                                    <ProductCard key={product.id} product={product as any} context="b2b" source="manufacturer_page" />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    <p>This manufacturer has not published any products yet.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="reviews" className="mt-4">
                      <div className="space-y-4">
                          {isLoadingReviews ? (
                              Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                          ) : reviews && reviews.length > 0 ? (
                              reviews.map((review) => <ReviewCard key={review.id} review={review} manufacturerSlug={manufacturer.slug} />)
                          ) : (
                              <p className="text-muted-foreground text-center py-8">No reviews yet for this manufacturer.</p>
                          )}
                      </div>
                    </TabsContent>
                    <TabsContent value="gallery" className="mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {(manufacturer as any).galleryImages?.map((url: string, index: number) => (
                            <div key={index} className="relative aspect-video w-full rounded-lg overflow-hidden">
                                <Image src={url} alt={`Gallery image ${index + 1}`} fill className="object-cover" />
                            </div>
                        ))}
                      </div>
                      {(!(manufacturer as any).galleryImages || (manufacturer as any).galleryImages.length === 0) && (
                        <p className="text-muted-foreground text-center py-8">No gallery images have been uploaded.</p>
                      )}
                    </TabsContent>
                    <TabsContent value="certifications" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Quality & Compliance</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {(manufacturer as any).certUrl && (
                                    <a href={(manufacturer as any).certUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline block truncate">{ (manufacturer as any).certUrl }</a>
                                )}
                                {(manufacturer as any).kraPinUrl && (
                                    <a href={(manufacturer as any).kraPinUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline block truncate">{ (manufacturer as any).kraPinUrl }</a>
                                )}
                                {!(manufacturer as any).certUrl && !(manufacturer as any).kraPinUrl && (
                                    <p className="text-muted-foreground">No certification documents provided.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
    </div>
  );
}
