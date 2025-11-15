
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Link as LinkIcon, Users, Handshake } from 'lucide-react';
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

type UserProfile = {
  id: string;
  attribution?: Record<string, string>;
};

const AttributionTable = ({ title, data }: { title: string, data: { name: string, count: number }[] }) => {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">Signups</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.name}>
                                <TableCell className="font-medium">{item.name || '(not set)'}</TableCell>
                                <TableCell className="text-right font-bold">{item.count}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function AcquisitionDashboard() {
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

    const aggregatedData = React.useMemo(() => {
        if (!users) return { bySource: [], byMedium: [], byCampaign: [], byReferrer: [] };
        
        const sources: Record<string, number> = {};
        const mediums: Record<string, number> = {};
        const campaigns: Record<string, number> = {};
        const referrers: Record<string, number> = {};

        users.forEach(user => {
            const attr = user.attribution;
            if (attr) {
                if (attr.utm_source) sources[attr.utm_source] = (sources[attr.utm_source] || 0) + 1;
                if (attr.utm_medium) mediums[attr.utm_medium] = (mediums[attr.utm_medium] || 0) + 1;
                if (attr.utm_campaign) campaigns[attr.utm_campaign] = (campaigns[attr.utm_campaign] || 0) + 1;
                if (attr.ref) referrers[attr.ref] = (referrers[attr.ref] || 0) + 1;
            }
        });

        const sortAndMap = (data: Record<string, number>) => Object.entries(data)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            bySource: sortAndMap(sources),
            byMedium: sortAndMap(mediums),
            byCampaign: sortAndMap(campaigns),
            byReferrer: sortAndMap(referrers),
        };

    }, [users]);
    
    if(isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon /> Acquisition Analytics</CardTitle>
                <CardDescription>Where are your users coming from? Analyze the effectiveness of your marketing campaigns and referral channels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Users /> Signups by Source</CardTitle>
                    </CardHeader>
                     <CardContent>
                        {aggregatedData.bySource.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={aggregatedData.bySource} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Signups" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted-foreground text-center py-12">No source data available.</p>
                        )}
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AttributionTable title="Signups by Medium" data={aggregatedData.byMedium} />
                    <AttributionTable title="Signups by Campaign" data={aggregatedData.byCampaign} />
                    <AttributionTable title="Signups by Referrer ID" data={aggregatedData.byReferrer} />
                </div>
            </CardContent>
        </Card>
    );
};
