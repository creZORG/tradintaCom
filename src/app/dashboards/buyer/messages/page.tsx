
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Search,
  MessageSquare,
  Loader2,
  Archive,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatInterface } from '@/components/chat-interface';

type Conversation = {
  id: string;
  title: string;
  contactName: string;
  contactId: string;
  contactRole: string;
  lastMessage: string;
  lastMessageTimestamp?: any;
  isUnread: boolean;
};

const ConversationListSkeleton = () => (
    <div className="p-2 space-y-1">
        {Array.from({length: 3}).map((_, i) => (
            <div key={i} className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        ))}
    </div>
);

function MessagesPageContent() {
    const { user } = useUser();
    const firestore = useFirestore();

    const conversationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
        collection(firestore, 'users', user.uid, 'conversations'),
        orderBy('lastMessageTimestamp', 'desc')
        );
    }, [user, firestore]);

    const { data: conversations, isLoading: isLoadingConversations } =
        useCollection<Conversation>(conversationsQuery);
        
    const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);

    const selectedConversation = useMemo(() => 
        conversations?.find(c => c.id === selectedConversationId)
    , [conversations, selectedConversationId]);

    const summaryStats = useMemo(() => {
        if (!conversations) return { total: 0, unread: 0, archived: 0 };
        return {
            total: conversations.length,
            unread: conversations.filter(c => c.isUnread).length,
            archived: conversations.filter(c => (c as any).status === 'archived').length,
        }
    }, [conversations]);

    // Set initial selected conversation
    React.useEffect(() => {
        if (!selectedConversationId && conversations && conversations.length > 0) {
        setSelectedConversationId(conversations[0].id);
        }
    }, [conversations, selectedConversationId]);
    
    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'Seller': return 'secondary';
            case 'Distributor': return 'outline';
            default: return 'default';
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary"/>Tradinta Inbox</CardTitle>
                    <CardDescription>Your central hub for all communications with manufacturers, distributors, and buyers.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoadingConversations ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{summaryStats.total}</div>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                             <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></div>
                        </CardHeader>
                        <CardContent>
                           {isLoadingConversations ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{summaryStats.unread}</div>}
                        </CardContent>
                    </Card>
                    <div className="lg:col-span-2 flex items-center justify-end gap-2">
                        <Button variant="outline"><Archive className="mr-2 h-4 w-4" /> Archive All</Button>
                        <Button><Edit className="mr-2 h-4 w-4" /> Compose Message</Button>
                    </div>
                </CardContent>
            </Card>
            <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-350px)]">
                {/* Left Column: Conversation List */}
                <div className="md:col-span-1 flex flex-col">
                    <Card className="flex flex-col h-full">
                        <CardHeader className="border-b p-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search conversations..." className="pl-8" />
                            </div>
                        </CardHeader>
                        <ScrollArea className="flex-grow">
                            <CardContent className="p-2 space-y-1">
                                {isLoadingConversations ? (
                                    <ConversationListSkeleton />
                                ) : conversations && conversations.length > 0 ? (
                                    conversations.map(convo => (
                                        <div key={convo.id} className={`p-3 rounded-lg cursor-pointer border-2 ${selectedConversationId === convo.id ? 'bg-muted border-primary' : 'border-transparent hover:bg-muted/50'}`} onClick={() => setSelectedConversationId(convo.id)}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-semibold text-sm truncate pr-2">{convo.contactName}</h3>
                                                {convo.isUnread && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></div>}
                                            </div>
                                            <p className="text-sm font-bold truncate">{convo.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <Badge variant={getRoleBadgeVariant(convo.contactRole)}>{convo.contactRole}</Badge>
                                                <p className="text-xs text-muted-foreground">{convo.lastMessageTimestamp ? new Date(convo.lastMessageTimestamp.seconds * 1000).toLocaleDateString() : ''}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-8 text-sm text-muted-foreground">
                                        No conversations yet.
                                    </div>
                                )}
                            </CardContent>
                        </ScrollArea>
                    </Card>
                </div>

                {/* Right Column: Message and Details View */}
                <div className="md:col-span-2 flex flex-col">
                   <Card className="flex-grow flex flex-col">
                        {!selectedConversation ? (
                            <div className="flex-grow flex items-center justify-center text-muted-foreground">
                                {isLoadingConversations ? <Loader2 className="h-8 w-8 animate-spin" /> : <p>Select a conversation to view messages.</p>}
                            </div>
                        ) : (
                            <>
                            <CardHeader className="flex flex-row justify-between items-center border-b">
                                <div>
                                    <CardTitle>{selectedConversation.title}</CardTitle>
                                    <CardDescription>Conversation with {selectedConversation.contactName}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboards/buyer/orders">
                                        <FileText className="mr-2 h-4 w-4" /> View Related Order
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col p-4">
                                {user && (
                                     <ChatInterface
                                        conversationId={selectedConversation.id}
                                        currentUser={{ uid: user.uid, displayName: user.displayName || "You", photoURL: user.photoURL }}
                                        contact={{ id: selectedConversation.contactId, name: selectedConversation.contactName }}
                                        userCollectionPath="users"
                                        contactCollectionPath="manufacturers"
                                    />
                                )}
                            </CardContent>
                            </>
                        )}
                   </Card>
                </div>
            </div>
        </div>
    )
}

export default function MessagesPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MessagesPageContent />
        </React.Suspense>
    )
}
