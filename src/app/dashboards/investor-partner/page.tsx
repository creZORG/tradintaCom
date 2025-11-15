
'use client';

import React from 'react';
import { useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Link as LinkIcon, Users, BarChart, DollarSign, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for demonstration until backend logic is complete in Stage 3
const mockMetrics = {
    clicks: 1256,
    leads: 78,
    attributedSales: 450250,
};

const mockCampaigns = [
    { id: 'CAMP-02', name: 'New Product Launch: Eco-Pack', seller: 'Constructa Ltd', status: 'Active' },
    { id: 'CAMP-05', name: 'Q4 Food Expo Promotion', seller: 'SuperBake Bakery', status: 'Active' },
];

const mockReferrals = [
    { id: 'USER-010', name: 'John Buyer', date: '2023-11-15', status: 'Verified' },
    { id: 'USER-011', name: 'Sarah Procures', date: '2023-11-14', status: 'Purchased' },
    { id: 'USER-012', name: 'Kimani Traders', date: '2023-11-12', status: 'Verified' },
];

export default function GrowthPartnerDashboard() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [referralLink, setReferralLink] = React.useState('');

    React.useEffect(() => {
        if (user) {
            // In a real app, you might want to use a short-link service, but this is functional
            const baseUrl = window.location.origin;
            setReferralLink(`${baseUrl}/?ref=${user.uid}`);
        }
    }, [user]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Copied to Clipboard!",
            description: "Your referral link has been copied.",
        });
    };
    
    if (isUserLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                 <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!user) {
        // This case should ideally be handled by middleware or layout checks
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                 <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                 <p className="text-muted-foreground">Loading user data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Your Growth Partner Dashboard</CardTitle>
                    <CardDescription>Track your impact, manage campaigns, and view your earnings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label htmlFor="referral-link" className="font-semibold">Your Unique Referral Link</Label>
                    <div className="flex gap-2 mt-1">
                        <Input id="referral-link" value={referralLink} readOnly />
                        <Button size="icon" onClick={copyToClipboard} aria-label="Copy referral link">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Share this link to attribute new sign-ups and sales to your account.</p>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockMetrics.clicks.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total clicks on your link</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockMetrics.leads}</div>
                        <p className="text-xs text-muted-foreground">New users signed up</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attributed Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">KES {mockMetrics.attributedSales.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From your referred users</p>
                    </CardContent>
                </Card>
            </div>
            
            <Tabs defaultValue="campaigns">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
                    <TabsTrigger value="referrals">Recent Referrals</TabsTrigger>
                </TabsList>
                <TabsContent value="campaigns">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Active Campaigns</CardTitle>
                            <CardDescription>Products and shops you are currently promoting.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Campaign</TableHead>
                                        <TableHead>Seller</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockCampaigns.map((campaign) => (
                                        <TableRow key={campaign.id}>
                                            <TableCell className="font-medium">{campaign.name}</TableCell>
                                            <TableCell>{campaign.seller}</TableCell>
                                            <TableCell><Badge>{campaign.status}</Badge></TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href="#">
                                                        <ExternalLink className="mr-2 h-3 w-3" /> View Brief
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="referrals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Referrals</CardTitle>
                            <CardDescription>New users who have signed up using your link.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Name</TableHead>
                                        <TableHead>Sign-up Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockReferrals.map((ref) => (
                                        <TableRow key={ref.id}>
                                            <TableCell className="font-medium">{ref.name}</TableCell>
                                            <TableCell>{ref.date}</TableCell>
                                            <TableCell>
                                                <Badge variant={ref.status === 'Purchased' ? 'secondary' : 'outline'}>
                                                    {ref.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}

    