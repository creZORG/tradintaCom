
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addSupportTicketReply, updateSupportTicketStatus } from '@/app/dashboards/support/actions';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ChatInterface } from '@/components/chat-interface';
import { useUser } from '@/firebase';

type SupportTicket = {
    id: string;
    ticketId: string;
    subject: string;
    userName: string;
    userEmail: string;
    userId: string;
    message: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    createdAt: any;
};

type TicketReply = {
    id: string;
    text: string;
    authorName: string;
    isSupportReply: boolean;
    createdAt: any;
};

const DetailItem = ({ label, value }: { label: string; value?: string | React.ReactNode }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || 'N/A'}</p>
    </div>
);

const getStatusBadge = (status: SupportTicket['status']) => {
    switch(status) {
        case 'Open': return <Badge variant="destructive">{status}</Badge>;
        case 'In Progress': return <Badge>{status}</Badge>;
        case 'Resolved': return <Badge variant="secondary">{status}</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

export default function SupportTicketDetailPage() {
    const params = useParams();
    const ticketId = params.id as string;
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    const ticketDocRef = useMemoFirebase(() => {
        if (!firestore || !ticketId) return null;
        return doc(firestore, 'supportTickets', ticketId);
    }, [firestore, ticketId]);
    const { data: ticket, isLoading } = useDoc<SupportTicket>(ticketDocRef);
    
    const handleStatusChange = async (newStatus: SupportTicket['status']) => {
        const result = await updateSupportTicketStatus(ticketId, newStatus);
         if (result.success) {
            toast({ title: `Ticket status updated to "${newStatus}"` });
             // No need to refetch, onSnapshot will update the data
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    }


    if (isLoading) {
        return <div className="space-y-6"><Skeleton className="h-96 w-full" /></div>;
    }
    
    if (!ticket) {
        return (
             <div className="text-center py-12">
                <h1 className="text-xl font-semibold">Ticket not found</h1>
                <p>The support ticket you are looking for does not exist.</p>
                <Button asChild className="mt-4"><Link href="/dashboards/support">Back to Tickets</Link></Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboards/support">Support</Link></BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Ticket #{ticket.ticketId}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/support"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Ticket Details
                </h1>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{ticket.subject}</CardTitle>
                            <CardDescription>
                                From <span className="font-semibold">{ticket.userName} ({ticket.userEmail})</span> on {new Date(ticket.createdAt?.seconds * 1000).toLocaleString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground italic">"{ticket.message}"</p>
                        </CardContent>
                    </Card>

                    <Card className="h-[60vh] flex flex-col">
                        <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
                        <CardContent className="flex-grow min-h-0">
                           {user && ticket && (
                                <ChatInterface
                                    conversationId={ticketId}
                                    currentUser={{ uid: user.uid, displayName: 'Tradinta Support', photoURL: null }}
                                    contact={{ id: ticket.userId, name: ticket.userName, avatarUrl: '' }}
                                    userCollectionPath="supportAgents" // Conceptual path
                                    contactCollectionPath="users"
                                />
                           )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1 space-y-6 sticky top-20">
                    <Card>
                        <CardHeader><CardTitle>Ticket Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <DetailItem label="Ticket ID" value={ticket.ticketId} />
                             <DetailItem label="Status" value={getStatusBadge(ticket.status)} />
                             <Separator/>
                             <DetailItem label="User Name" value={ticket.userName} />
                             <DetailItem label="User Email" value={ticket.userEmail} />
                        </CardContent>
                        <CardFooter>
                            <Select onValueChange={(val: SupportTicket['status']) => handleStatusChange(val)} value={ticket.status}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Open">Set to Open</SelectItem>
                                    <SelectItem value="In Progress">Set to In Progress</SelectItem>
                                    <SelectItem value="Resolved">Set to Resolved</SelectItem>
                                </SelectContent>
                             </Select>
                        </CardFooter>
                     </Card>
                </div>
            </div>

        </div>
    );
}
