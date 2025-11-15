
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Users, BarChart, PlusCircle } from "lucide-react";

const campaigns = [
    { id: 'CAMP-01', name: 'End of Year Clearance', status: 'Active', budget: 50000, impressions: 120500, clicks: 8230 },
    { id: 'CAMP-02', name: 'New Product Launch: Eco-Pack', status: 'Active', budget: 75000, impressions: 250000, clicks: 15400 },
    { id: 'CAMP-03', name: 'Back to School Special', status: 'Expired', budget: 30000, impressions: 85000, clicks: 4500 },
    { id: 'CAMP-04', name: 'Q1 2024 Planning', status: 'Draft', budget: 100000, impressions: 0, clicks: 0 },
];

const ambassadors = [
    { id: 'AMB001', name: 'John Doe', status: 'Verified', campaigns: 2, followers: '15k' },
    { id: 'AMB002', name: 'Jane Smith', status: 'Pending', campaigns: 0, followers: '5k' },
];

export default function MarketingDashboard() {
    return (
        <Tabs defaultValue="campaigns">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="campaigns">Campaign Management</TabsTrigger>
                <TabsTrigger value="ambassadors">Ambassador Network</TabsTrigger>
                <TabsTrigger value="promotions">Promotions & Banners</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Marketing Campaigns</CardTitle>
                                <CardDescription>Manage promotional campaigns and ad placements.</CardDescription>
                            </div>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Campaign</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Budget (KES)</TableHead>
                                    <TableHead>Impressions</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell><Badge variant={campaign.status === 'Active' ? 'default' : 'outline'}>{campaign.status}</Badge></TableCell>
                                        <TableCell>{campaign.budget.toLocaleString()}</TableCell>
                                        <TableCell>{campaign.impressions.toLocaleString()}</TableCell>
                                        <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="outline" size="sm">Edit</Button>
                                            <Button size="sm"><BarChart className="mr-1 h-4 w-4"/> View Analytics</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="ambassadors">
                <Card>
                    <CardHeader>
                        <CardTitle>Ambassador Network</CardTitle>
                        <CardDescription>Manage and approve influencers and brand ambassadors.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Active Campaigns</TableHead>
                                    <TableHead>Follower Count</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ambassadors.map((amb) => (
                                    <TableRow key={amb.id}>
                                        <TableCell className="font-medium">{amb.name}</TableCell>
                                        <TableCell><Badge variant={amb.status === 'Verified' ? 'secondary' : 'default'}>{amb.status}</Badge></TableCell>
                                        <TableCell>{amb.campaigns}</TableCell>
                                        <TableCell>{amb.followers}</TableCell>
                                        <TableCell>
                                            {amb.status === 'Pending' && <Button size="sm">Approve</Button>}
                                            {amb.status === 'Verified' && <Button variant="outline" size="sm">View Profile</Button>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="promotions">
                 <Card>
                    <CardHeader>
                        <CardTitle>Homepage Banners & Promotions</CardTitle>
                        <CardDescription>Manage featured listings and homepage ad banners.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="h-[300px] w-full bg-muted rounded-md flex items-center justify-center">
                           <Megaphone className="h-16 w-16 text-muted-foreground" />
                           <p className="ml-4 text-muted-foreground">Banner Management Component Here</p>
                       </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
