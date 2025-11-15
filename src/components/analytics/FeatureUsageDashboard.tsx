
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { subDays, startOfDay } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

type FeatureUsage = {
    feature: string;
    timestamp: any;
    userRole: 'manufacturer' | 'buyer' | 'partner' | string;
    metadata?: {
        page?: string; // e.g., 'products', 'dashboard'
    }
};

const PORTAL_PAGES: Record<string, {name: string, path: string}[]> = {
    'manufacturer': [
        { name: 'Seller Centre', path: '/dashboards/seller-centre' },
        { name: 'Products List', path: '/dashboards/seller-centre/products' },
        { name: 'New Product', path: '/dashboards/seller-centre/products/new' },
        { name: 'Edit Product', path: '/dashboards/seller-centre/products/edit/[id]' },
        { name: 'Product Analytics', path: '/dashboards/seller-centre/products/analytics/[id]' },
        { name: 'Quotations', path: '/dashboards/seller-centre/quotations' },
        { name: 'Profile', path: '/dashboards/seller-centre/profile' },
        { name: 'Verification', path: '/dashboards/seller-centre/verification' },
        { name: 'Messages', path: '/dashboards/seller-centre/messages' },
    ],
    'buyer': [
        { name: 'Buyer Dashboard', path: '/dashboards/buyer' },
        { name: 'Orders & RFQs', path: '/dashboards/buyer/orders' },
        { name: 'RFQ Details', path: '/dashboards/buyer/quotations/[id]' },
        { name: 'Messages', path: '/dashboards/buyer/messages' },
        { name: 'TradPoints', path: '/dashboards/buyer/tradpoints' },
        { name: 'Wishlist', path: '/buyer/wishlist' },
    ],
    'partner': [
        { name: 'Growth Partner Dashboard', path: '/dashboards/growth-partner' },
    ]
};


const FeatureUsageByRole = ({ role, events, isLoading }: { role: 'manufacturer' | 'buyer' | 'partner', events: FeatureUsage[], isLoading: boolean }) => {
    
    const pages = PORTAL_PAGES[role] || [];

    const pageData = React.useMemo(() => {
        if (!events) return {};

        const data: Record<string, { visits: number, features: Record<string, number> }> = {};

        pages.forEach(page => {
            const pageKey = page.path.replace(/\[.*?\]/g, '[id]');
            data[pageKey] = { visits: 0, features: {} };
        });

        events.forEach(event => {
            const pageKey = event.metadata?.page?.replace(/\[.*?\]/g, '[id]');
            if (pageKey && data[pageKey]) {
                const featureKey = event.feature.split(':')[1];
                if (featureKey === 'view') {
                    data[pageKey].visits++;
                } else {
                    if (!data[pageKey].features[event.feature]) {
                        data[pageKey].features[event.feature] = 0;
                    }
                    data[pageKey].features[event.feature]++;
                }
            }
        });
        
        return data;

    }, [events, pages]);


    if (isLoading) {
         return <div className="space-y-2">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    }

    return (
        <Accordion type="multiple" className="w-full">
            {pages.map(page => {
                const pageKey = page.path.replace(/\[.*?\]/g, '[id]');
                const data = pageData[pageKey];
                const totalPageInteractions = (data?.visits || 0) + Object.values(data?.features || {}).reduce((a, b) => a + b, 0);

                if (totalPageInteractions === 0) return null;

                return (
                    <AccordionItem key={page.path} value={page.path}>
                        <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4">
                                <div>
                                    <p className="font-semibold">{page.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{pageKey}</p>
                                </div>
                                <span className="font-bold">{data?.visits || 0} Visits</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           {data && Object.keys(data.features).length > 0 ? (
                             <Table>
                               <TableBody>
                                 {Object.entries(data.features).map(([feature, count]) => (
                                     <TableRow key={feature}>
                                         <TableCell className="text-muted-foreground pl-8">{feature}</TableCell>
                                         <TableCell className="text-right font-medium">{count}</TableCell>
                                     </TableRow>
                                 ))}
                               </TableBody>
                            </Table>
                           ) : (
                               <p className="text-xs text-muted-foreground text-center py-4">No specific feature interactions recorded for this page.</p>
                           )}
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
};

export default function FeatureUsageDashboard() {
    const firestore = useFirestore();
    const [timeFilter, setTimeFilter] = React.useState('7days');
    
    const usageQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'featureUsage'), orderBy('timestamp', 'desc'));
        
        const now = new Date();
        if (timeFilter === 'today') {
            q = query(q, where('timestamp', '>=', startOfDay(now)));
        } else if (timeFilter === '7days') {
            q = query(q, where('timestamp', '>=', subDays(now, 7)));
        } else if (timeFilter === '30days') {
             q = query(q, where('timestamp', '>=', subDays(now, 30)));
        }
        return q;

    }, [firestore, timeFilter]);

    const { data: usageEvents, isLoading } = useCollection<FeatureUsage>(usageQuery);

    const sellerEvents = React.useMemo(() => usageEvents?.filter(e => e.userRole === 'manufacturer') || [], [usageEvents]);
    const buyerEvents = React.useMemo(() => usageEvents?.filter(e => e.userRole === 'buyer') || [], [usageEvents]);
    const partnerEvents = React.useMemo(() => usageEvents?.filter(e => e.userRole === 'partner') || [], [usageEvents]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Feature Usage Analytics</CardTitle>
                        <CardDescription>How users are interacting with key features, segmented by role.</CardDescription>
                    </div>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="sellers">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="sellers">Sellers ({sellerEvents.length})</TabsTrigger>
                        <TabsTrigger value="buyers">Buyers ({buyerEvents.length})</TabsTrigger>
                        <TabsTrigger value="partners">Growth Partners ({partnerEvents.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sellers" className="mt-4">
                       <FeatureUsageByRole role="manufacturer" events={sellerEvents} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="buyers" className="mt-4">
                       <FeatureUsageByRole role="buyer" events={buyerEvents} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="partners" className="mt-4">
                        <FeatureUsageByRole role="partner" events={partnerEvents} isLoading={isLoading} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
