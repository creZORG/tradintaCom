
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChevronLeft, Copy, QrCode, Link as LinkIcon, Calendar, Globe, Users, DollarSign, BarChart, ExternalLink, Loader2, Download } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, orderBy, getCountFromServer, limit, addDoc, serverTimestamp, setDoc, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import QRCode from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ResponsiveContainer, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { subDays, format, startOfDay } from 'date-fns';
import { nanoid } from 'nanoid';

type Click = {
    id: string;
    targetUrl: string;
    timestamp: any;
    campaign?: string;
}

type ShortLink = {
    id: string;
    destinationUrl: string;
    shortUrl: string;
    clickCount: number;
    createdAt: any;
};

type AttributedSale = {
    id: string;
    orderId: string;
    productName?: string; 
    saleAmount: number;
    commissionEarned: number;
    date: any;
};

type SignUp = {
    id: string;
    fullName: string;
    email: string;
    registrationDate: any;
}

type UserProfile = {
    tradintaId?: string;
}

async function createShortLink(firestore: any, partnerId: string, destinationUrl: string, campaign?: string) {
    const currentHost = window.location.origin;
    try {
        // Allow relative paths starting with /
        if (destinationUrl.startsWith('/')) {
           // This is a valid relative path, proceed.
        } else {
            // For full URLs, validate the domain
            const destUrl = new URL(destinationUrl);
            if (destUrl.hostname !== new URL(currentHost).hostname) {
                throw new Error('Destination URL must be on the same domain.');
            }
        }
    } catch (e: any) {
        // Catch invalid URL format errors
        if (e instanceof TypeError) {
             throw new Error('Invalid destination URL format. Must be a relative path (e.g., /products) or a full URL on the same domain.');
        }
        // Re-throw other errors (like the custom domain error)
        throw e;
    }

    const shortLinkId = nanoid(7);
    const shortLinkRef = doc(firestore, 'shortlinks', shortLinkId);
    await setDoc(shortLinkRef, {
        id: shortLinkId,
        destinationUrl,
        partnerId,
        campaign: campaign || null,
        createdAt: serverTimestamp(),
        clickCount: 0,
    });
    return shortLinkId;
}

const StatCard = ({ title, value, icon, isLoading }: {title: string, value: string | number, icon: React.ReactNode, isLoading: boolean}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);


export default function LinkManagementPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [destinationUrl, setDestinationUrl] = React.useState('');
  const [campaignTag, setCampaignTag] = React.useState('');
  const [generatedLink, setGeneratedLink] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const qrCodeRef = React.useRef<HTMLDivElement>(null);


  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userDocRef);
  const tradintaId = userProfile?.tradintaId;

  // --- Data Fetching ---
  const clicksQuery = useMemoFirebase(() => {
    if (!firestore || !tradintaId) return null;
    return query(collection(firestore, 'linkClicks'), where('referrerId', '==', tradintaId), orderBy('timestamp', 'desc'));
  }, [firestore, tradintaId]);
  
  const signupsQuery = useMemoFirebase(() => {
    if (!firestore || !tradintaId) return null;
    return query(collection(firestore, 'users'), where('referredBy', '==', tradintaId), orderBy('registrationDate', 'desc'));
  }, [firestore, tradintaId]);

  const salesQuery = useMemoFirebase(() => {
    if(!user?.uid || !firestore) return null;
    return query(collection(firestore, 'attributedSales'), where('partnerId', '==', user.uid), orderBy('date', 'desc'));
  }, [user, firestore]);
  
  const shortlinksQuery = useMemoFirebase(() => {
    if(!user?.uid || !firestore) return null;
    return query(collection(firestore, 'shortlinks'), where('partnerId', '==', user.uid), orderBy('createdAt', 'desc'));
  }, [user, firestore]);


  const { data: clicks, isLoading: isLoadingClicks } = useCollection<Click>(clicksQuery);
  const { data: signups, isLoading: isLoadingSignups } = useCollection<SignUp>(signupsQuery);
  const { data: sales, isLoading: isLoadingSales } = useCollection<AttributedSale>(salesQuery);
  const { data: shortlinks, isLoading: isLoadingShortlinks, forceRefetch } = useCollection<ShortLink>(shortlinksQuery);
  
  const isLoading = isLoadingProfile || isLoadingClicks || isLoadingSignups || isLoadingSales || isLoadingShortlinks;
  
  const handleGenerateLink = async () => {
      if (!destinationUrl) {
          toast({title: "Please enter a destination URL.", variant: "destructive"});
          return;
      }
      if (!user?.uid || !firestore) {
          toast({title: "Could not generate link. User not found.", variant: "destructive"});
          return;
      }
      setIsGenerating(true);
      try {
          const shortLinkId = await createShortLink(firestore, user.uid, destinationUrl, campaignTag);
          
          let baseUrl = window.location.origin;
          
          setGeneratedLink(`${baseUrl}/l/${shortLinkId}`);
          forceRefetch(); // This will re-fetch the shortlinks and update the table.
      } catch (error: any) {
          toast({ title: 'Error', description: error.message, variant: 'destructive'});
      } finally {
          setIsGenerating(false);
      }
  };
  
  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied to Clipboard!',
      description: 'Your tracking link has been copied.',
    });
  };
  
  const downloadQRCode = () => {
    const canvas = qrCodeRef.current?.querySelector<HTMLCanvasElement>('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `tradinta-qr-code.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else {
        toast({ title: 'Error', description: 'Could not download QR code.', variant: 'destructive'});
    }
  };

  const clickChartData = React.useMemo(() => {
    if (!clicks) return [];
    const days = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), i), 'MMM d')).reverse();
    const clicksByDay = days.reduce((acc, day) => {
        acc[day] = 0;
        return acc;
    }, {} as Record<string, number>);

    clicks.forEach(click => {
        if (click.timestamp && click.timestamp.toDate() >= subDays(startOfDay(new Date()), 6)) {
            const day = format(click.timestamp.toDate(), 'MMM d');
            if (day in clicksByDay) {
                clicksByDay[day]++;
            }
        }
    });
    return Object.entries(clicksByDay).map(([name, Clicks]) => ({ name, Clicks }));
  }, [clicks]);


  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboards/growth-partner">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Links & Analytics</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild><Link href="/dashboards/growth-partner"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link></Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">Links & Analytics</h1>
      </div>
      
       <div className="grid md:grid-cols-3 gap-4">
          <StatCard title="Total Clicks" value={clicks?.length || 0} icon={<LinkIcon />} isLoading={isLoading} />
          <StatCard title="Total Sign-ups" value={signups?.length || 0} icon={<Users />} isLoading={isLoading} />
          <StatCard title="Total Attributed Sales" value={`KES ${(sales?.reduce((sum, s) => sum + s.saleAmount, 0) || 0).toLocaleString()}`} icon={<DollarSign />} isLoading={isLoading} />
       </div>

      <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                <CardTitle>Link Generator</CardTitle>
                <CardDescription>Create unique tracking links for specific products or pages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="dest-url">Destination URL</Label>
                    <Input id="dest-url" placeholder="e.g., /products/shop-id/product-slug" value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="campaign-tag">Campaign Tag (Optional)</Label>
                    <Input id="campaign-tag" placeholder="e.g., 'facebook-ad-1' or 'q4-promo'" value={campaignTag} onChange={e => setCampaignTag(e.target.value)} />
                </div>
                 <Button onClick={handleGenerateLink} disabled={isGenerating}>
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Generate Link
                 </Button>
            </CardContent>
            {generatedLink && (
                 <CardFooter className="flex-col items-start gap-2 border-t pt-4">
                    <Label>Your Generated Link:</Label>
                    <div className="flex items-center gap-2 w-full">
                        <Input value={generatedLink} readOnly className="text-xs" />
                        <Button onClick={() => copyToClipboard(generatedLink)} size="icon" variant="outline"><Copy className="h-4 w-4"/></Button>
                        <Dialog>
                            <DialogTrigger asChild><Button size="icon" variant="outline"><QrCode className="h-4 w-4" /></Button></DialogTrigger>
                            <DialogContent className="sm:max-w-xs">
                                <DialogHeader><DialogTitle>Tracking Link QR Code</DialogTitle></DialogHeader>
                                <div className="p-4 bg-white rounded-md flex items-center justify-center" ref={qrCodeRef}><QRCode value={generatedLink} size={256} /></div>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
                                    <Button onClick={downloadQRCode}><Download className="mr-2 h-4 w-4"/>Download PNG</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardFooter>
            )}
          </Card>
           <Card>
            <CardHeader>
                <CardTitle>Clicks Over Last 7 Days</CardTitle>
            </CardHeader>
             <CardContent>
                {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                <ResponsiveContainer width="100%" height={250}>
                    <RechartsBarChart data={clickChartData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                        <Bar dataKey="Clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
                )}
             </CardContent>
          </Card>
      </div>
      
       <Card>
            <CardHeader><CardTitle>Generated Links</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow>
                        <TableHead>Short Link</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead>Actions</TableHead>
                   </TableRow></TableHeader>
                    <TableBody>
                        {isLoadingShortlinks ? Array.from({length: 3}).map((_,i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-5 w-full"/></TableCell></TableRow>)
                        : shortlinks && shortlinks.length > 0 ? shortlinks.map(link => (
                            <TableRow key={link.id}><TableCell className="font-mono text-xs">{`/l/${link.id}`}</TableCell><TableCell className="text-xs truncate max-w-xs">{link.destinationUrl}</TableCell><TableCell className="text-right font-bold">{link.clickCount}</TableCell><TableCell><Button size="icon" variant="ghost" onClick={() => copyToClipboard(`${window.location.origin}/l/${link.id}`)}><Copy className="h-4 w-4"/></Button></TableCell></TableRow>
                        )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No shortlinks created yet.</TableCell></TableRow>
                        }
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

       <div className="grid lg:grid-cols-2 gap-6">
            <Card>
            <CardHeader><CardTitle>Recent Sign-ups</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>User Name</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 3}).map((_,i) => <TableRow key={i}><TableCell><Skeleton className="h-5 w-32"/></TableCell><TableCell><Skeleton className="h-5 w-24"/></TableCell></TableRow>)
                        : signups && signups.length > 0 ? signups.slice(0,5).map(signup => (
                            <TableRow key={signup.id}><TableCell>{signup.fullName}</TableCell><TableCell className="text-xs text-muted-foreground">{new Date(signup.registrationDate?.seconds * 1000).toLocaleDateString()}</TableCell></TableRow>
                        )) : <TableRow><TableCell colSpan={2} className="text-center h-24">No sign-ups yet.</TableCell></TableRow>
                        }
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
             <Card>
            <CardHeader><CardTitle>Recent Attributed Sales</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Sale Amount</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 3}).map((_,i) => <TableRow key={i}><TableCell><Skeleton className="h-5 w-32"/></TableCell><TableCell><Skeleton className="h-5 w-24 ml-auto"/></TableCell></TableRow>)
                        : sales && sales.length > 0 ? sales.slice(0,5).map(sale => (
                            <TableRow key={sale.id}><TableCell>{sale.productName || `Order ${sale.orderId.substring(0,6)}`}</TableCell><TableCell className="text-right font-medium">KES {sale.saleAmount.toLocaleString()}</TableCell></TableRow>
                        )) : <TableRow><TableCell colSpan={2} className="text-center h-24">No sales yet.</TableCell></TableRow>
                        }
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
       </div>
    </div>
  );
}
