
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Ticket, LifeBuoy, AlertTriangle, Loader2, PlusCircle } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type SupportTicket = {
    id: string;
    ticketId: string;
    subject: string;
    userName: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Open' | 'In Progress' | 'Resolved';
    createdAt: any;
};

type Dispute = {
    id: string;
    orderId: string;
    buyerName: string;
    sellerName: string;
    reason: string;
    status: 'Under Review' | 'Awaiting User Response' | 'Resolved';
};

const getTicketStatusBadge = (status: SupportTicket['status']) => {
    switch(status) {
        case 'Open': return <Badge variant="destructive">{status}</Badge>;
        case 'In Progress': return <Badge>{status}</Badge>;
        case 'Resolved': return <Badge variant="secondary">{status}</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

const getDisputeStatusBadge = (status: Dispute['status']) => {
    switch(status) {
        case 'Under Review': return <Badge variant="destructive">{status}</Badge>;
        case 'Awaiting User Response': return <Badge>{status}</Badge>;
        case 'Resolved': return <Badge variant="secondary">{status}</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

function SupportDashboardContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'tickets';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`);
    };

    const ticketsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'supportTickets'), where('status', '!=', 'Resolved'), orderBy('status'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    
    const disputesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'disputes'), where('status', '!=', 'Resolved'), orderBy('status'));
    }, [firestore]);

    const { data: supportTickets, isLoading: isLoadingTickets } = useCollection<SupportTicket>(ticketsQuery);
    const { data: disputes, isLoading: isLoadingDisputes } = useCollection<Dispute>(disputesQuery);

    const renderTicketRows = () => {
        if (isLoadingTickets) {
            return Array.from({length: 3}).map((_, i) => (
                <TableRow key={`skel-ticket-${i}`}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-32" /></TableCell>
                </TableRow>
            ));
        }
        if (!supportTickets || supportTickets.length === 0) {
            return <TableRow><TableCell colSpan={6} className="h-24 text-center">No active support tickets.</TableCell></TableRow>;
        }
        return supportTickets.map((ticket) => (
            <TableRow key={ticket.id}>
                <TableCell className="font-medium font-mono text-xs">{ticket.ticketId}</TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>{ticket.userName}</TableCell>
                <TableCell><Badge variant={ticket.priority === 'High' ? 'destructive' : ticket.priority === 'Medium' ? 'default' : 'secondary'}>{ticket.priority}</Badge></TableCell>
                <TableCell>{getTicketStatusBadge(ticket.status)}</TableCell>
                <TableCell>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboards/support/tickets/${ticket.id}`}>View & Respond</Link>
                    </Button>
                </TableCell>
            </TableRow>
        ));
    };
    
    const renderDisputeRows = () => {
         if (isLoadingDisputes) {
            return Array.from({length: 2}).map((_, i) => (
                 <TableRow key={`skel-dispute-${i}`}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-28" /></TableCell>
                </TableRow>
            ));
        }
        if (!disputes || disputes.length === 0) {
            return <TableRow><TableCell colSpan={5} className="text-center h-24">No active disputes.</TableCell></TableRow>;
        }
        return disputes.map((dispute) => (
             <TableRow key={dispute.id}>
                <TableCell className="font-medium font-mono text-xs">{dispute.id.substring(0,8)}</TableCell>
                <TableCell>{dispute.buyerName} vs. {dispute.sellerName}</TableCell>
                <TableCell>{dispute.reason}</TableCell>
                <TableCell>{getDisputeStatusBadge(dispute.status)}</TableCell>
                <TableCell>
                    <Button size="sm"><AlertTriangle className="mr-2 h-4 w-4"/>Mediate</Button>
                </TableCell>
            </TableRow>
        ));
    }


    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
                <TabsTrigger value="disputes">Dispute Resolution</TabsTrigger>
                <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
            </TabsList>

            <TabsContent value="tickets" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Active Support Tickets</CardTitle>
                                <CardDescription>Manage and respond to user queries and technical issues.</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href="/dashboards/support/tickets/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> New Ticket
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket ID</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {renderTicketRows()}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="disputes" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Active Disputes</CardTitle>
                        <CardDescription>Mediate and resolve formal disputes between buyers and sellers.</CardDescription>
                    </CardHeader>                    
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dispute ID</TableHead>
                                    <TableHead>Involved Parties</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderDisputeRows()}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="knowledge-base" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Knowledge Base Management</CardTitle>
                        <CardDescription>Create and edit help articles for the support center.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-12">
                       <LifeBuoy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                       <h3 className="text-lg font-semibold">Manage Help Articles</h3>
                       <p className="text-muted-foreground mt-2 mb-4">The Knowledge Base is managed in the main Content Management dashboard.</p>
                       <Button asChild>
                        <Link href="/dashboards/content-management?tab=blog">Go to Content Management</Link>
                       </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

export default function SupportDashboardPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SupportDashboardContent />
        </React.Suspense>
    )
}
