
'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  PlusCircle,
  BarChart,
  Users,
  Loader2,
  Mail,
  Search,
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking } from '@/firebase';
import { collection, query, collectionGroup, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { Campaign, UserProfile } from '@/app/lib/definitions';
import GrowthTiersTab from '@/components/marketing/GrowthTiersTab';
import NewsletterAssistantTab from '@/components/marketing/NewsletterAssistantTab';
import SearchAndDiscoveryTab from '@/components/marketing/SearchAndDiscoveryTab';


const MarketingDashboardContent = () => {
    const firestore = useFirestore();

    const campaignsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'marketingCampaigns'));
    }, [firestore]);

    const ambassadorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'partner'));
    }, [firestore]);

    const { data: campaigns, isLoading: isLoadingCampaigns } = useCollection<Campaign>(campaignsQuery);
    const { data: ambassadors, isLoading: isLoadingAmbassadors } = useCollection<UserProfile>(ambassadorsQuery);
    
    const renderCampaignRows = () => {
        if (isLoadingCampaigns) {
            return Array.from({length: 3}).map((_, i) => (
                <TableRow key={`skel-camp-${i}`}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-40" /></TableCell>
                </TableRow>
            ));
        }
        if (!campaigns || campaigns.length === 0) {
            return <TableRow><TableCell colSpan={6} className="text-center h-24">No manufacturer campaigns found.</TableCell></TableRow>;
        }
        return campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell><Badge variant={campaign.status === 'Active' ? 'default' : 'outline'}>{campaign.status}</Badge></TableCell>
                <TableCell>{campaign.budget?.toLocaleString() || 'N/A'}</TableCell>
                <TableCell>{campaign.impressions?.toLocaleString() || 0}</TableCell>
                <TableCell>{campaign.clicks?.toLocaleString() || 0}</TableCell>
                <TableCell className="space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button size="sm"><BarChart className="mr-1 h-4 w-4"/> View Analytics</Button>
                </TableCell>
            </TableRow>
        ));
    };
    
    const renderAmbassadorRows = () => {
        if (isLoadingAmbassadors) {
            return Array.from({length: 2}).map((_, i) => (
                 <TableRow key={`skel-amb-${i}`}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                </TableRow>
            ));
        }
        if (!ambassadors || ambassadors.length === 0) {
            return <TableRow><TableCell colSpan={5} className="text-center h-24">No Growth Partners found.</TableCell></TableRow>;
        }
        return ambassadors.map((amb) => (
            <TableRow key={amb.id}>
                <TableCell className="font-medium">{amb.fullName}</TableCell>
                <TableCell><Badge variant={'secondary'}>{'Verified'}</Badge></TableCell>
                <TableCell>{0}</TableCell>
                <TableCell>{'N/A'}</TableCell>
                <TableCell>
                    <Button variant="outline" size="sm">View Profile</Button>
                </TableCell>
            </TableRow>
        ));
    };
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'growth-tiers';
    
    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`);
    };
    
    const navLinks = [
        { id: 'growth-tiers', label: 'Growth Tiers' },
        { id: 'newsletter', label: 'Newsletter Assistant' },
        { id: 'discovery', label: 'Search & Discovery' },
        { id: 'partner-campaigns', label: 'Partner Campaigns' },
        { id: 'manufacturer-campaigns', label: 'Manufacturer Campaigns' },
        { id: 'ambassadors', label: 'Growth Partner Network' },
        { id: 'promotions', label: 'Site Content' },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'newsletter':
                return <NewsletterAssistantTab />;
            case 'discovery':
                return <SearchAndDiscoveryTab />;
            case 'partner-campaigns':
                return (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Growth Partner Campaigns</CardTitle>
                                    <CardDescription>Create and track commissions for campaigns run by partners.</CardDescription>
                                </div>
                                <Button><PlusCircle className="mr-2 h-4 w-4" /> New Partner Campaign</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-lg">
                                <p>Partner campaign management is coming soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'manufacturer-campaigns':
                return (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Manufacturer Ad Campaigns</CardTitle>
                                    <CardDescription>Manage promotional campaigns and ad placements across the platform.</CardDescription>
                                </div>
                                <Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Campaign</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Campaign Name</TableHead><TableHead>Status</TableHead><TableHead>Budget (KES)</TableHead><TableHead>Impressions</TableHead><TableHead>Clicks</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>{renderCampaignRows()}</TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                );
            case 'ambassadors':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Growth Partner Network</CardTitle>
                            <CardDescription>Manage and approve influencers and brand ambassadors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Active Campaigns</TableHead><TableHead>Follower Count</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>{renderAmbassadorRows()}</TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                );
            case 'promotions':
                 return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Site Content Management</CardTitle>
                            <CardDescription>Manage homepage banners, blog posts, and other site content.</CardDescription>
                        </CardHeader>
                         <CardContent className="text-center py-12">
                            <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Manage Content Centrally</h3>
                            <p className="text-muted-foreground mt-2 mb-4">All site content, including homepage banners and blog posts, is managed in the Content Management dashboard.</p>
                            <Button asChild><Link href="/dashboards/content-management">Go to Content Management</Link></Button>
                        </CardContent>
                    </Card>
                 );
            case 'growth-tiers':
            default:
                return <GrowthTiersTab />;
        }
    };
    
    return (
        <div className="grid md:grid-cols-4 gap-6 items-start">
            <nav className="md:col-span-1 space-y-1">
                {navLinks.map(link => (
                    <Button 
                        key={link.id}
                        variant={activeTab === link.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleTabChange(link.id)}
                    >
                        {link.label}
                    </Button>
                ))}
            </nav>
            <div className="md:col-span-3">
                {renderContent()}
            </div>
        </div>
    );
};


export default function MarketingDashboardPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MarketingDashboardContent />
        </React.Suspense>
    )
}
