
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from './ui/button';
import { MessageSquare, LifeBuoy, Send, Loader2, FileText, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { nanoid } from 'nanoid';
import { ChatInterface } from './chat-interface';

type SupportTicket = {
  id: string;
  ticketId: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: any;
  userId: string;
  userName: string;
};

const NewTicketForm = ({ onTicketCreated }: { onTicketCreated: () => void }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !firestore) {
      toast({ title: 'You must be logged in to create a ticket.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    try {
      const ticketData = {
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        ticketId: nanoid(8).toUpperCase(),
        subject,
        message,
        status: 'Open',
        createdAt: serverTimestamp(),
      };
      await addDocumentNonBlocking(collection(firestore, 'supportTickets'), ticketData);
      toast({ title: 'Support Ticket Created', description: 'Our team will get back to you shortly.' });
      onTicketCreated();
      (event.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required placeholder="e.g., Issue with my last order" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">How can we help?</Label>
        <Textarea id="message" name="message" required placeholder="Please describe your issue in detail..." className="min-h-[150px]" />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Submit Ticket
      </Button>
    </form>
  );
};

const TicketChatView = ({ ticket, onBack }: { ticket: SupportTicket, onBack: () => void }) => {
    const { user } = useUser();
    if (!user) return null;

    return (
        <div className="h-full flex flex-col">
             <Button variant="ghost" size="sm" onClick={onBack} className="self-start mb-2">
                <ArrowLeft className="mr-2 h-4 w-4"/> Back to My Tickets
            </Button>
            <div className="border rounded-md p-3 mb-4">
                <h4 className="font-semibold text-sm">{ticket.subject}</h4>
                <p className="text-xs text-muted-foreground">Ticket ID: {ticket.ticketId}</p>
            </div>
            <div className="flex-grow min-h-0">
                <ChatInterface
                    conversationId={ticket.id}
                    currentUser={{ uid: user.uid, displayName: user.displayName || "You", photoURL: user.photoURL }}
                    contact={{ id: 'support', name: 'Tradinta Support' }}
                    userCollectionPath="users" // The user is in the 'users' collection
                    contactCollectionPath="supportAgents" // A conceptual collection for support
                />
            </div>
        </div>
    )
}

const MyTicketsList = ({ onSelectTicket }: { onSelectTicket: (ticket: SupportTicket) => void }) => {
    const { user } = useUser();
    const firestore = useFirestore();

    const ticketsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'supportTickets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: tickets, isLoading } = useCollection<SupportTicket>(ticketsQuery);

    const getStatusBadge = (status: SupportTicket['status']) => {
        switch(status) {
            case 'Open': return <Badge variant="destructive"><FileText className="mr-1 h-3 w-3" />{status}</Badge>;
            case 'In Progress': return <Badge><Clock className="mr-1 h-3 w-3" />{status}</Badge>;
            case 'Resolved': return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" />{status}</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    if (!tickets || tickets.length === 0) {
        return <div className="text-center text-sm text-muted-foreground py-12">You have no support tickets.</div>
    }

    return (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
                {tickets.map(ticket => (
                    <button key={ticket.id} onClick={() => onSelectTicket(ticket)} className="w-full text-left border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold text-sm pr-2">{ticket.subject}</p>
                            {getStatusBadge(ticket.status)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                            <span>Ticket ID: {ticket.ticketId}</span>
                            <span>•</span>
                            <span>{ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    )
}

export function SupportWidget() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState('new-ticket');
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null);

  if (!user) {
    // Optionally, hide the widget for logged-out users, or show a login prompt
    return null;
  }
  
  const handleSelectTicket = (ticket: SupportTicket) => {
      setSelectedTicket(ticket);
  }

  const handleBackToList = () => {
      setSelectedTicket(null);
  }
  
  const handleTicketCreated = () => {
      setActiveTab('my-tickets');
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-5 right-5 h-14 w-14 rounded-full shadow-lg z-40"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="sr-only">Open Support</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" />
            Tradinta Support
          </SheetTitle>
          <SheetDescription>Get help or create a new support ticket.</SheetDescription>
        </SheetHeader>
        <div className="flex-grow min-h-0">
         {selectedTicket ? (
             <TicketChatView ticket={selectedTicket} onBack={handleBackToList} />
         ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new-ticket">New Ticket</TabsTrigger>
                <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
              </TabsList>
              <TabsContent value="new-ticket" className="py-4">
                <NewTicketForm onTicketCreated={handleTicketCreated} />
              </TabsContent>
              <TabsContent value="my-tickets" className="py-4">
                <MyTicketsList onSelectTicket={handleSelectTicket} />
              </TabsContent>
            </Tabs>
         )}
        </div>
        <SheetFooter>
            <SheetClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
            </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
