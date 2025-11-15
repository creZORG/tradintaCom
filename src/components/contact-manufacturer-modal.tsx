
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import type { Product, Manufacturer } from '@/lib/definitions';
import { Loader2, Info } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { Alert, AlertDescription } from './ui/alert';
import { ChatInterface, getOrCreateConversation } from './chat-interface';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface ContactManufacturerModalProps {
  product: Product;
  manufacturer: Manufacturer;
  children: React.ReactNode;
}

export function ContactManufacturerModal({
  product,
  manufacturer,
  children,
}: ContactManufacturerModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && user && firestore && !conversationId) {
      setIsLoading(true);
      getOrCreateConversation(
        firestore,
        user.uid,
        manufacturer.id,
        product.id,
        user.displayName || "Tradinta Buyer",
        manufacturer.shopName || manufacturer.name,
        product.name
      ).then(id => {
        setConversationId(id);
        setIsLoading(false);
      }).catch(error => {
        console.error("Failed to get or create conversation:", error);
        toast({
          title: "Error",
          description: "Could not start a conversation. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        setOpen(false);
      });
    }
  }, [open, user, firestore, product, manufacturer, conversationId, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with {manufacturer.shopName || manufacturer.name}</DialogTitle>
          <DialogDescription>
            Regarding product:{' '}
            <span className="font-semibold text-primary">{product.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden">
          {!user ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="font-semibold">Please log in to chat</p>
                  <p className="text-sm text-muted-foreground">You need an account to contact sellers.</p>
                   <Button asChild className="mt-4"><Link href="/login">Login or Sign Up</Link></Button>
              </div>
          ) : isLoading || !conversationId ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Loading conversation...</p>
            </div>
          ) : (
            <ChatInterface
              conversationId={conversationId}
              currentUser={{
                uid: user!.uid,
                displayName: user!.displayName || "You",
                photoURL: user!.photoURL,
              }}
              contact={{
                id: manufacturer.id,
                name: manufacturer.shopName || manufacturer.name,
                avatarUrl: manufacturer.logoUrl,
              }}
              userCollectionPath="users"
              contactCollectionPath="manufacturers"
            />
          )}
        </div>

        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            You can view and continue all conversations in your{' '}
            <Link href="/dashboards/buyer/messages" className="font-bold underline">Tradinta Inbox</Link>.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
