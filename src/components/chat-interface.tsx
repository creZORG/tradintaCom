
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
  doc,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Paperclip, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

type Message = {
  id: string;
  from: 'user' | 'contact';
  text?: string;
  imageUrl?: string;
  timestamp?: any;
};

interface ChatInterfaceProps {
  conversationId: string;
  currentUser: { uid: string; displayName: string; photoURL?: string | null };
  contact: { id: string; name: string; avatarUrl?: string };
  userCollectionPath: string; // e.g., 'users' or 'manufacturers'
  contactCollectionPath: string; // e.g., 'manufacturers' or 'users'
}

export function ChatInterface({
  conversationId,
  currentUser,
  contact,
  userCollectionPath,
  contactCollectionPath,
}: ChatInterfaceProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser || !conversationId) return null;
    return query(
      collection(firestore, userCollectionPath, currentUser.uid, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, currentUser, conversationId, userCollectionPath]);

  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        // A slight delay ensures the DOM has updated with new messages before scrolling
        setTimeout(() => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !imageUrl) || !firestore || !currentUser) {
      return;
    }
    setIsSending(true);

    const timestamp = serverTimestamp();
    const messageData = {
      from: 'user', // 'user' is always the perspective of the person sending
      text: message,
      imageUrl,
      timestamp,
    };

    try {
      const batch = writeBatch(firestore);
      
      // 1. Add message to sender's collection
      const senderMessageRef = doc(collection(firestore, userCollectionPath, currentUser.uid, 'conversations', conversationId, 'messages'));
      batch.set(senderMessageRef, messageData);
      
      // 2. Add message to recipient's collection
      const recipientMessageRef = doc(collection(firestore, contactCollectionPath, contact.id, 'conversations', conversationId, 'messages'));
      batch.set(recipientMessageRef, { ...messageData, from: 'contact' });

      // 3. Update sender's conversation metadata
      const senderConvoRef = doc(firestore, userCollectionPath, currentUser.uid, 'conversations', conversationId);
      batch.set(senderConvoRef, { 
        lastMessage: message || 'Image sent',
        lastMessageTimestamp: timestamp,
        isUnread: false 
      }, { merge: true });

      // 4. Update recipient's conversation metadata
      const recipientConvoRef = doc(firestore, contactCollectionPath, contact.id, 'conversations', conversationId);
      batch.set(recipientConvoRef, { 
        lastMessage: message || 'Image sent',
        lastMessageTimestamp: timestamp,
        isUnread: true 
      }, { merge: true });

      await batch.commit();

      setMessage('');
      setImageUrl(null);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({ title: 'Error Sending Message', description: error.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4 bg-muted/50 rounded-md" ref={scrollAreaRef as any}>
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 mb-4 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.from === 'contact' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contact.avatarUrl} />
                  <AvatarFallback>{contact.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-sm p-2 rounded-lg ${msg.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                {msg.imageUrl && (
                  <div className="relative group w-48 h-48 mb-2">
                    <Image src={msg.imageUrl} alt="Uploaded content" layout="fill" className="object-cover rounded-md" />
                     <a href={msg.imageUrl} download target="_blank" rel="noopener noreferrer" className="absolute bottom-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-4 w-4" />
                    </a>
                  </div>
                )}
                {msg.text && <p className="text-sm">{msg.text}</p>}
              </div>
              {msg.from === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.photoURL || ''} />
                  <AvatarFallback>{currentUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground text-sm flex items-center justify-center h-full">
            <p>Start the conversation by sending a message.</p>
          </div>
        )}
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="mt-4">
        {imageUrl && (
          <div className="relative w-24 h-24 mb-2 p-2 border rounded-md">
            <Image src={imageUrl} alt="preview" fill className="object-cover rounded-sm" />
            <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground" onClick={() => setImageUrl(null)}>
              <span className="sr-only">Remove Image</span>
              &times;
            </Button>
          </div>
        )}
        <div className="grid gap-2">
          <Textarea
            placeholder="Type your message here..."
            className="min-h-20"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <PhotoUpload
              onUpload={setImageUrl}
              onLoadingChange={setIsUploading}
              disabled={isSending || isUploading}
            >
               <Button type="button" variant="ghost" size="icon" disabled={isSending || isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>
            </PhotoUpload>
            <Button type="submit" disabled={isSending || isUploading || (!message.trim() && !imageUrl)}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export async function getOrCreateConversation(
    firestore: any, 
    buyerId: string, 
    sellerId: string, 
    productId: string,
    buyerName: string,
    sellerName: string,
    productName: string
): Promise<string> {
    const conversationsRef = collection(firestore, 'users', buyerId, 'conversations');
    const q = query(
        conversationsRef,
        where('contactId', '==', sellerId),
        where('productId', '==', productId),
        limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    // No existing conversation, create a new one for both parties
    const timestamp = serverTimestamp();
    const batch = writeBatch(firestore);

    // Create a new conversation doc in the buyer's subcollection
    const newBuyerConvoRef = doc(collection(firestore, 'users', buyerId, 'conversations'));
    const conversationId = newBuyerConvoRef.id;
    
    const newConversationData = {
        id: conversationId,
        title: productName,
        productId: productId, // Add productId
        contactName: sellerName,
        contactId: sellerId,
        contactRole: 'Seller',
        lastMessage: 'Conversation started about ' + productName,
        lastMessageTimestamp: timestamp,
        isUnread: false,
    };
    batch.set(newBuyerConvoRef, newConversationData);
    
    // Create the corresponding conversation doc in the seller's subcollection
    const newSellerConvoRef = doc(firestore, 'manufacturers', sellerId, 'conversations', conversationId);
    const sellerConvoData = {
        ...newConversationData,
        contactName: buyerName,
        contactId: buyerId,
        contactRole: 'Buyer',
        isUnread: true, // It's a new conversation for the seller
    };
    batch.set(newSellerConvoRef, sellerConvoData);
    
    await batch.commit();
    return conversationId;
}
