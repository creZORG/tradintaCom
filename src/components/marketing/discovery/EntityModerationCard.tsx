
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';
import { updateDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface EntityModerationCardProps {
  entity: ProductWithRanking;
  entityType: 'product' | 'manufacturer';
}

export function EntityModerationCard({ entity, entityType }: EntityModerationCardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isDemoted, setIsDemoted] = React.useState(entity.moderation?.isDemoted || false);

  const getEntityRef = React.useCallback(() => {
    if (!firestore) return null;
    if (entityType === 'product') {
      return doc(firestore, `manufacturers/${entity.manufacturerId}/products`, entity.id);
    }
    return doc(firestore, `manufacturers`, entity.id);
  }, [firestore, entity, entityType]);

  const handleToggleDemotion = async () => {
    const entityRef = getEntityRef();
    if (!entityRef) return;

    setIsProcessing(true);
    const newDemotionStatus = !isDemoted;

    try {
      await updateDoc(entityRef, {
        'moderation.isDemoted': newDemotionStatus
      });
      setIsDemoted(newDemotionStatus);
      toast({
        title: `Entity ${newDemotionStatus ? 'Deboosted' : 'Restored'}`,
        description: `${entity.name} will now have a ${newDemotionStatus ? 'negative' : 'neutral'} ranking adjustment.`,
        variant: newDemotionStatus ? 'destructive' : 'default',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to update status: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Image
            src={entity.imageUrl || 'https://placehold.co/64x64'}
            alt={entity.name}
            width={64}
            height={64}
            className="rounded-md border"
          />
          <div>
            <CardTitle>{entity.name}</CardTitle>
            <CardDescription>
              Current Discovery Score (TradRank™): <span className="font-bold text-primary">{entity.tradRank.toFixed(0)}</span>
            </CardDescription>
             {isDemoted && (
                <p className="text-xs text-destructive font-semibold flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-4 w-4" /> This item is currently deboosted.
                </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
            Use these tools to manually adjust the ranking of this item in search and discovery feeds. Changes may take a few minutes to reflect.
        </p>
        <div className="flex items-center gap-4">
          <Button
            variant={isDemoted ? 'secondary' : 'destructive'}
            onClick={handleToggleDemotion}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isDemoted ? <TrendingUp className="mr-2 h-4 w-4" /> : <TrendingDown className="mr-2 h-4 w-4" />}
            {isDemoted ? 'Restore Rank' : 'Auto-Deboost'}
          </Button>
          {/* Manual score adjustment can be added here later */}
        </div>
      </CardContent>
    </Card>
  );
}
