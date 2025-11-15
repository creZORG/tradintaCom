'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart as BarChartIcon, Coins, Users, CalendarDays, BarChartHorizontal } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { getPointsAnalytics } from '@/app/dashboards/tradcoin-admin/analytics-actions';
import { Button } from '../ui/button';

type AnalyticsData = {
    totalPoints: number;
    totalUsersWithPoints: number;
    topEarners: { userId: string; fullName: string; totalPoints: number }[];
    pointsByDay: { day: string; points: number }[];
    pointsByReason: { reason: string; points: number }[];
};

const StatCard = ({ title, value, icon, isLoading }: { title: string, value: string | number, icon: React.ReactNode, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>}
        </CardContent>
    </Card>
);

export default function PointsAnalytics() {
    const [data, setData] = React.useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [leaderboardLimit, setLeaderboardLimit] = React.useState(10);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const analyticsData = await getPointsAnalytics({ leaderboardLimit });
                setData(analyticsData);
            } catch (error) {
                console.error("Failed to fetch points analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [leaderboardLimit]);

    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sortedPointsByDay = data?.pointsByDay.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChartIcon /> Points Analytics</CardTitle>
                    <CardDescription>Insights into the TradPoints ecosystem.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <StatCard title="Total Points Awarded" value={data?.totalPoints || 0} icon={<Coins />} isLoading={isLoading} />
                    <StatCard title="Users with Points" value={data?.totalUsersWithPoints || 0} icon={<Users />} isLoading={isLoading} />
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><CalendarDays /> Points Awarded by Day (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-64 w-full" /> :
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={sortedPointsByDay}>
                                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                                <Tooltip />
                                <Bar dataKey="points" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        }
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><BarChartHorizontal /> Top Earning Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-64 w-full" /> :
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data?.pointsByReason} layout="vertical" margin={{ left: 120 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="reason" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={120} />
                                <Tooltip />
                                <Bar dataKey="points" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Points" />
                            </BarChart>
                        </ResponsiveContainer>
                        }
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Top Earners Leaderboard</CardTitle>
                            <CardDescription>Users who have accumulated the most points.</CardDescription>
                        </div>
                        {leaderboardLimit === 10 && (
                            <Button variant="outline" size="sm" onClick={() => setLeaderboardLimit(100)}>View Top 100</Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Rank</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Total Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({length:5}).map((_,i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            )) : data?.topEarners.map((user, index) => (
                                <TableRow key={user.userId}>
                                    <TableCell className="font-medium">#{index + 1}</TableCell>
                                    <TableCell>{user.fullName || 'Unnamed User'}</TableCell>
                                    <TableCell className="text-right font-bold">{user.totalPoints.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}