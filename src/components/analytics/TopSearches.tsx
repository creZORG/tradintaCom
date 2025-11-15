
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsService } from '@/services';
import { Badge } from '../ui/badge';
import { BarChart, Search } from 'lucide-react';

type SearchTerm = {
    term: string;
    count: number;
};

const TopSearchesTable = ({ period }: { period: 'daily' | 'weekly' | 'monthly' }) => {
    const [data, setData] = React.useState<SearchTerm[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const results = await AnalyticsService.getTopSearches(period);
                setData(results);
            } catch (error) {
                console.error("Failed to fetch top searches:", error);
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [period]);
    
    if (isLoading) {
        return (
             <div className="space-y-2">{Array.from({length: 10}).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        );
    }
    
    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-2" />
                <p>No search data available for this period.</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Search Term</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={item.term}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell><Badge variant="outline">{item.term}</Badge></TableCell>
                        <TableCell className="text-right font-bold">{item.count.toLocaleString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


export default function TopSearches() {
    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart /> Search Trends</CardTitle>
                <CardDescription>Top 10 most popular search terms entered by users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="weekly">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="daily">Today</TabsTrigger>
                        <TabsTrigger value="weekly">This Week</TabsTrigger>
                        <TabsTrigger value="monthly">This Month</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily" className="mt-4">
                        <TopSearchesTable period="daily" />
                    </TabsContent>
                    <TabsContent value="weekly" className="mt-4">
                         <TopSearchesTable period="weekly" />
                    </TabsContent>
                    <TabsContent value="monthly" className="mt-4">
                         <TopSearchesTable period="monthly" />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
