
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Globe,
  Loader2,
  Eye,
  ShieldCheck,
  MapPin,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Palette,
  Sparkles,
  Info,
  Image as ImageIcon,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { cn, generateSlug } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { africanCountries, kenyanCounties } from '@/lib/countries';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PERMISSIONS } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PhotoUpload } from '@/components/ui/photo-upload';

type PolicyData = {
    paymentPolicy?: string;
    shippingPolicy?: string;
    returnPolicy?: string;
}

type MarketingPlan = {
  features?: string[];
}

type ManufacturerData = {
  shopId?: string;
  slug?: string;
  shopName?: string;
  shopNameHistory?: string[];
  tagline?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  galleryImages?: string[];
  logoHistory?: string[];
  businessLicenseNumber?: string;
  kraPin?: string;
  address?: string;
  phone?: string;
  country?: string;
  county?: string;
  paymentPolicy?: string;
  shippingPolicy?: string;
  returnPolicy?: string;
  website?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  contactEmail?: string;
  acceptsTradePay?: boolean;
  issuesTradPoints?: boolean;
  certifications?: string[];
  verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
  overview?: string;
  pendingPolicies?: PolicyData;
  policyChangesStatus?: 'pending' | 'approved' | 'rejected';
  theme?: string;
  marketingPlanId?: string;
};

const THEMES = [
  { id: 'tradinta-blue', name: 'Tradinta Blue', colors: ['bg-blue-500', 'bg-blue-700', 'bg-gray-200'] },
  { id: 'forest-green', name: 'Forest Green', colors: ['bg-green-600', 'bg-green-800', 'bg-emerald-100'] },
  { id: 'royal-crimson', name: 'Royal Crimson', colors: ['bg-red-600', 'bg-red-800', 'bg-rose-100'] },
  { id: 'midnight-gold', name: 'Midnight Gold', colors: ['bg-gray-800', 'bg-black', 'bg-yellow-400'] },
];

export default function EditShopProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [dbData, setDbData] = React.useState<ManufacturerData | null>(null);

  // Form state
  const [slug, setSlug] = React.useState('');
  const [shopName, setShopName] = React.useState('');
  const [shopTagline, setShopTagline] = React.useState('');
  const [shopDescription, setShopDescription] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [coverImageUrl, setCoverImageUrl] = React.useState('');
  const [galleryImages, setGalleryImages] = React.useState<string[]>(['', '', '']);
  const [country, setCountry] = React.useState('');
  const [county, setCounty] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [paymentPolicy, setPaymentPolicy] = React.useState('');
  const [shippingPolicy, setShippingPolicy] = React.useState('');
  const [returnPolicy, setReturnPolicy] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [facebook, setFacebook] = React.useState('');
  const [instagram, setInstagram] = React.useState('');
  const [x, setX] = React.useState('');
  const [issuesTradPoints, setIssuesTradPoints] = React.useState(false);
  const [theme, setTheme] = React.useState('tradinta-blue');
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [verificationStatus, setVerificationStatus] = React.useState<ManufacturerData['verificationStatus']>('Unsubmitted');
  const [marketingPlan, setMarketingPlan] = React.useState<MarketingPlan | null>(null);

  const platformSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'config') : null, [firestore]);
  const { data: platformSettings, isLoading: isLoadingSettings } = useDoc(platformSettingsRef);

  React.useEffect(() => {
    if (user && firestore) {
      const fetchManufacturerData = async () => {
        const manufRef = doc(firestore, 'manufacturers', user.uid);
        const docSnap = await getDoc(manufRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as ManufacturerData;
          setDbData(data);
          setSlug(data.slug || '');
          setShopName(data.shopName || '');
          setShopTagline(data.tagline || '');
          setShopDescription(data.overview || '');
          setLogoUrl(data.logoUrl || '');
          setCoverImageUrl(data.coverImageUrl || '');
          setGalleryImages(Array.isArray(data.galleryImages) ? [...data.galleryImages, ...Array(Math.max(0, 3 - data.galleryImages.length)).fill('')] : ['', '', '']);
          setCountry(data.country || '');
          setCounty(data.county || '');
          setContactEmail(data.contactEmail || data.email || '');
          setPaymentPolicy(data.paymentPolicy || '');
          setShippingPolicy(data.shippingPolicy || '');
          setReturnPolicy(data.returnPolicy || '');
          setWebsite(data.website || '');
          setFacebook(data.facebook || '');
          setInstagram(data.instagram || '');
          setX(data.x || '');
          setIssuesTradPoints(data.issuesTradPoints === true);
          setVerificationStatus(data.verificationStatus || 'Unsubmitted');
          setTheme(data.theme || 'tradinta-blue');

           if (data.marketingPlanId) {
            const planRef = doc(firestore, 'marketingPlans', data.marketingPlanId);
            const planSnap = await getDoc(planRef);
            if (planSnap.exists()) {
              setMarketingPlan(planSnap.data() as MarketingPlan);
            }
          }
        }
        setIsLoading(false);
      };
      fetchManufacturerData();
    }
  }, [user, firestore]);

  const isVerified = verificationStatus === 'Verified';
  const hasThemePermission = marketingPlan?.features?.includes(PERMISSIONS.SHOP.CUSTOM_THEME) === true;
  const isTradePayEnabled = platformSettings?.enableTradePay ?? false;

  const generateKeywords = (...fields: (string | undefined)[]) => {
      const keywords = new Set<string>();
      fields.forEach(field => {
          if (!field) return;
          field.toLowerCase().split(/\s+/).forEach(word => {
              const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
              if (cleanWord) keywords.add(cleanWord);
          });
      });
      return Array.from(keywords);
  }
  
  const handleGalleryImageChange = (index: number, url: string) => {
    const newImages = [...galleryImages];
    newImages[index] = url;
    setGalleryImages(newImages);
  };

  const handleSaveChanges = async () => {
    if (!user || !firestore) {
      toast({ title: "Not authenticated", description: "You must be logged in to save changes.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);

    const manufacturerData: Partial<ManufacturerData> & { shopNameHistory?: any; updatedAt?: any } = {
        tagline: shopTagline,
        overview: shopDescription,
        logoUrl,
        coverImageUrl,
        galleryImages: galleryImages.filter(Boolean),
        website,
        facebook,
        instagram,
        x,
        contactEmail,
        acceptsTradePay: false,
        issuesTradPoints: isVerified ? true : issuesTradPoints,
        country,
        county: country === 'Kenya' ? county : '',
        location: country === 'Kenya' ? `${county}, ${country}` : country,
        theme: hasThemePermission ? theme : dbData?.theme || 'tradinta-blue',
        updatedAt: serverTimestamp(),
        searchKeywords: generateKeywords(shopName, shopTagline, dbData?.industry),
    };

    if (isVerified) {
        const pendingPolicyChanges: PolicyData = {};
        if (paymentPolicy !== dbData?.paymentPolicy) pendingPolicyChanges.paymentPolicy = paymentPolicy;
        if (shippingPolicy !== dbData?.shippingPolicy) pendingPolicyChanges.shippingPolicy = shippingPolicy;
        if (returnPolicy !== dbData?.returnPolicy) pendingPolicyChanges.returnPolicy = returnPolicy;

        if (Object.keys(pendingPolicyChanges).length > 0) {
            manufacturerData.pendingPolicies = pendingPolicyChanges;
            manufacturerData.policyChangesStatus = 'pending';
        }
    } else {
        manufacturerData.shopName = shopName;
        manufacturerData.paymentPolicy = paymentPolicy;
        manufacturerData.shippingPolicy = shippingPolicy;
        manufacturerData.returnPolicy = returnPolicy;

        if (dbData?.shopName && shopName !== dbData.shopName) {
            manufacturerData.shopNameHistory = arrayUnion(dbData.shopName);
        }

        let finalSlug = slug;
        if (!slug || (dbData?.shopName !== shopName)) {
            finalSlug = generateSlug(shopName);
            const slugQuery = query(collection(firestore, "manufacturers"), where("slug", "==", finalSlug));
            const querySnapshot = await getDocs(slugQuery);
            let isSlugTaken = false;
            querySnapshot.forEach((doc) => { if (doc.id !== user.uid) { isSlugTaken = true; } });
            if (isSlugTaken) {
                finalSlug = `${finalSlug}-${user.uid.substring(0, 4)}`;
                toast({ title: "Shop Name Taken", description: `A unique ID has been added to your shop URL: ${finalSlug}` });
            }
        }
        manufacturerData.slug = finalSlug;
        setSlug(finalSlug);
    }
    
    try {
      const manufRef = doc(firestore, 'manufacturers', user.uid);
      await setDoc(manufRef, manufacturerData, { merge: true });
      
      toast({ title: "Profile Saved!", description: "Your changes have been successfully saved." });

      if (manufacturerData.policyChangesStatus === 'pending') {
        toast({ title: "Policies Awaiting Approval", description: "Your policy changes have been submitted for review." });
      }

    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message || "An error occurred while saving.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading || isLoadingSettings) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboards/seller-centre">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Shop Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboards/seller-centre">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Edit Shop Profile
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild disabled={!slug}>
              <Link href={`/manufacturer/${slug}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View Public Shop
              </Link>
          </Button>
          <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
       {dbData?.policyChangesStatus === 'pending' && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Policies Pending Approval</AlertTitle>
          <AlertDescription>
            Your recent policy changes are under review. They are not yet live on your shop profile.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader><CardTitle>Shop Details</CardTitle><CardDescription>Manage your shop's name, tagline, description, and location.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
               <div className="grid gap-3"><Label htmlFor="shop-name">Shop Name</Label><Input id="shop-name" value={shopName} onChange={(e) => setShopName(e.target.value)} disabled={isVerified} />{isVerified && <p className="text-xs text-muted-foreground">Shop name cannot be changed after verification.</p>}</div>
                <div className="grid gap-3"><Label htmlFor="shop-tagline">Shop Tagline</Label><Input id="shop-tagline" placeholder="e.g., Quality Building Materials for East Africa" value={shopTagline} onChange={(e) => setShopTagline(e.target.value)}/></div>
                <div className="grid gap-3"><Label htmlFor="shop-description">Shop Description</Label><Textarea id="shop-description" className="min-h-32" placeholder="Tell buyers about your business..." value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} /></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t"><div className="grid gap-2"><Label htmlFor="country">Country</Label><Select onValueChange={(value) => { setCountry(value); if (value !== 'Kenya') setCounty(''); }} value={country}><SelectTrigger id="country"><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent>{africanCountries.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select></div>{country === 'Kenya' && (<div className="grid gap-2"><Label htmlFor="county">County (Kenya)</Label><Select onValueChange={setCounty} value={county}><SelectTrigger id="county"><SelectValue placeholder="Select county" /></SelectTrigger><SelectContent>{kenyanCounties.map(c => (<SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>))}</SelectContent></Select></div>)}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Shop Media</CardTitle><CardDescription>Upload your logo, a cover image, and gallery photos.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-3"><Label>Logo</Label><PhotoUpload label="Upload Logo (1:1 ratio recommended)" onUpload={setLogoUrl} initialUrl={logoUrl}/></div>
                <div className="grid gap-3"><Label>Cover Image</Label><PhotoUpload label="Upload cover image (16:9 ratio recommended)" onUpload={setCoverImageUrl} initialUrl={coverImageUrl}/></div>
                <div className="grid gap-3"><Label>Gallery Images</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <PhotoUpload label="Image 1" onUpload={url => handleGalleryImageChange(0, url)} initialUrl={galleryImages[0]}/>
                        <PhotoUpload label="Image 2" onUpload={url => handleGalleryImageChange(1, url)} initialUrl={galleryImages[1]}/>
                        <PhotoUpload label="Image 3" onUpload={url => handleGalleryImageChange(2, url)} initialUrl={galleryImages[2]}/>
                    </div>
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Policies</CardTitle><CardDescription>Define your payment, shipping, and return policies. {isVerified && "Changes require admin approval."}</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-3"><Label htmlFor="payment-policy">Payment Policy</Label><Textarea id="payment-policy" placeholder="e.g., We accept TradePay, Bank Transfer, and LPO for approved clients. Payment is due upon order confirmation." value={paymentPolicy} onChange={(e) => setPaymentPolicy(e.target.value)} /></div>
                <div className="grid gap-3"><Label htmlFor="shipping-policy">Shipping Policy</Label><Textarea id="shipping-policy" placeholder="e.g., We ship within 3-5 business days. Delivery fees vary by location." value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} /></div>
                 <div className="grid gap-3"><Label htmlFor="return-policy">Return Policy</Label><Textarea id="return-policy" placeholder="e.g., Returns accepted within 7 days for defective products only. Buyer is responsible for return shipping." value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} /><Alert variant="default" className="mt-2"><Info className="h-4 w-4" /><AlertTitle>Suggestion</AlertTitle><AlertDescription className="text-xs">A good return policy builds trust. Consider including: a clear timeframe (e.g., 7-14 days), conditions for returns (e.g., damaged or incorrect items), and how a buyer can initiate the process.</AlertDescription></Alert></div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Contact & Social</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3"><Label htmlFor="contact-email">Public Contact Email</Label><div className="relative"><Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="contact-email" type="email" className="pl-8" placeholder="sales@mycompany.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></div></div>
                     <div className="grid gap-3"><Label htmlFor="website">Website</Label><div className="relative"><Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="website" className="pl-8" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} /></div></div>
                     <div className="grid gap-3"><Label htmlFor="facebook">Facebook URL</Label><div className="relative"><Facebook className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="facebook" className="pl-8" placeholder="facebook.com/..." value={facebook} onChange={(e) => setFacebook(e.target.value)} /></div></div>
                     <div className="grid gap-3"><Label htmlFor="instagram">Instagram URL</Label><div className="relative"><Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="instagram" className="pl-8" placeholder="instagram.com/..." value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div></div>
                     <div className="grid gap-3"><Label htmlFor="x">X (Twitter) URL</Label><div className="relative"><Twitter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="x" className="pl-8" placeholder="x.com/..." value={x} onChange={(e) => setX(e.target.value)} /></div></div>
                </CardContent>
            </Card>
            <Card className="relative">
                <CardHeader><CardTitle className="flex items-center gap-2"><Palette/> Shop Theme</CardTitle><CardDescription>Choose a color scheme for your public shop page.</CardDescription></CardHeader>
                <CardContent>{!hasThemePermission && (<div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-lg"><Sparkles className="w-8 h-8 text-primary mb-2" /><p className="font-semibold mb-2">Unlock Custom Themes</p><p className="text-xs text-muted-foreground mb-4">Subscribe to a Growth Tier to customize your shop's appearance.</p><Button size="sm" asChild><Link href="/marketing-plans">Upgrade Plan</Link></Button></div>)}<RadioGroup value={theme} onValueChange={(val) => setTheme(val)} className="grid grid-cols-2 gap-4">{THEMES.map((themeOption) => (<Label key={themeOption.id} htmlFor={themeOption.id} className="block cursor-pointer rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value={themeOption.id} id={themeOption.id} className="sr-only" /><span className="text-sm font-semibold">{themeOption.name}</span><div className="flex items-center gap-2 mt-2">{themeOption.colors.map((color, i) => (<div key={i} className={cn("h-6 w-full rounded", color)}></div>))}</div></Label>))}</RadioGroup></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Shop Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4"><div className="flex items-center justify-between"><Label htmlFor="tradepay-switch" className={cn("flex flex-col gap-1", !isTradePayEnabled && "cursor-not-allowed opacity-70")}><span>Accept TradePay</span><span className="font-normal text-xs text-muted-foreground">{isTradePayEnabled ? 'Allow buyers to pay via TradePay wallet.' : 'TradePay is currently disabled by administrators.'}</span></Label><Switch id="tradepay-switch" disabled={!isTradePayEnabled} checked={dbData?.acceptsTradePay && isTradePayEnabled} /></div><TooltipProvider><Tooltip><TooltipTrigger asChild><div className="flex items-center justify-between"><Label htmlFor="tradpoints-switch" className={cn("flex flex-col gap-1", isVerified && "cursor-not-allowed")}><span>Issue TradPoints</span><span className="font-normal text-xs text-muted-foreground">Reward buyers for purchases. Requires verification.</span></Label><Switch id="tradpoints-switch" checked={isVerified ? true : issuesTradPoints} onCheckedChange={setIssuesTradPoints} disabled={isVerified} /></div></TooltipTrigger>{isVerified && (<TooltipContent><p>This is enabled for all verified sellers.</p></TooltipContent>)}</Tooltip></TooltipProvider></CardContent>
            </Card>
        </div>
      </div>
       <div className="flex items-center justify-end gap-2 md:hidden mt-6">
          <Button variant="outline" size="sm">Cancel</Button>
          <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}{isSaving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
    </div>
  );
}
