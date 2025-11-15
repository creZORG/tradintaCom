
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { Save, Loader2, Pin, PinOff, Image as ImageIcon, Trash2 } from "lucide-react";
import { EntityLookUp } from './discovery/EntityLookup';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';
import Image from 'next/image';
import { nanoid } from 'nanoid';

type PinnedEntity = {
    id: string;
    name: string;
    imageUrl?: string;
    entityType: 'product' | 'manufacturer';
}

interface AdSlotCardProps {
  slot: {
    slotId: string;
    defaultText: string;
    entityType: 'product' | 'manufacturer';
  };
}

export function AdSlotCard({ slot }: AdSlotCardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const slotDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'adSlots', slot.slotId);
  }, [firestore, slot.slotId]);

  const { data: adSlotData, isLoading: isLoadingSlot, forceRefetch } = useDoc(slotDocRef);

  const [pinnedEntities, setPinnedEntities] = React.useState<PinnedEntity[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (adSlotData?.pinnedEntities) {
      setPinnedEntities(adSlotData.pinnedEntities);
    } else {
      setPinnedEntities([]);
    }
  }, [adSlotData]);

  const handleAddEntity = (entity: ProductWithRanking | null) => {
    if (!entity) return;

    if (pinnedEntities.some(p => p.id === entity.id)) {
        toast({ title: 'Already Added', description: 'This item is already in the list for this slot.', variant: 'default'});
        return;
    }

    const newEntity: PinnedEntity = {
        id: entity.id,
        name: entity.name,
        imageUrl: entity.imageUrl,
        entityType: slot.entityType
    };
    setPinnedEntities(prev => [...prev, newEntity]);
  };
  
  const handleRemoveEntity = (entityId: string) => {
    setPinnedEntities(prev => prev.filter(p => p.id !== entityId));
  }

  const handleSaveChanges = async () => {
    if (!slotDocRef) return;
    setIsProcessing(true);
    try {
      await setDoc(slotDocRef, {
        id: slot.slotId,
        name: slot.defaultText,
        type: slot.entityType,
        pinnedEntities: pinnedEntities,
        updatedAt: new Date(),
      }, { merge: true });
      
      toast({ title: "Ad Slot Updated", description: `${pinnedEntities.length} item(s) are now pinned.` });
      forceRefetch();

    } catch (error: any) {
      toast({ title: 'Error', description: `Could not save override: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearOverride = async () => {
      if (!slotDocRef) return;
      setIsProcessing(true);
      try {
          await deleteDoc(slotDocRef);
          setPinnedEntities([]);
          toast({ title: "Override Cleared", description: `The slot will now use automatic selection.` });
          forceRefetch();
      } catch (error: any) {
           toast({ title: 'Error', description: `Could not clear override: ${error.message}`, variant: 'destructive' });
      } finally {
          setIsProcessing(false);
      }
  };
  
  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-base">{slot.defaultText}</CardTitle>
        <CardDescription>Slot ID: <code className="font-mono text-xs">{slot.slotId}</code></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Currently Pinned ({pinnedEntities.length})</h4>
          {isLoadingSlot ? <Loader2 className="animate-spin h-5 w-5" /> : pinnedEntities.length > 0 ? (
             <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {pinnedEntities.map(entity => (
                    <div key={entity.id} className="flex items-center gap-4 p-2 rounded-md bg-background border">
                        {entity.imageUrl ? (
                            <Image src={entity.imageUrl} alt={entity.name} width={32} height={32} className="rounded-md" />
                        ) : (
                            <div className="h-8 w-8 bg-secondary rounded-md flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground"/></div>
                        )}
                        <div className="flex-grow">
                            <p className="font-medium text-sm">{entity.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {entity.id}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveEntity(entity.id)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                ))}
             </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No manual override. Slot is using automatic selection.</p>
          )}
        </div>
         <div className="space-y-2">
            <h4 className="text-sm font-semibold">Add Entity to Slot</h4>
            <EntityLookUp entityType={slot.entityType} onEntitySelect={handleAddEntity} />
        </div>
      </CardContent>
       <CardFooter className="flex justify-end gap-2">
        {(adSlotData && adSlotData.pinnedEntities) && 
            <Button variant="ghost" onClick={handleClearOverride} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PinOff className="mr-2 h-4 w-4" />}
                Clear All
            </Button>
        }
        <Button onClick={handleSaveChanges} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Pin className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
