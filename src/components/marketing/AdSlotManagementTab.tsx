
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MARKETING_FEATURES, type FeatureGroup } from '@/lib/marketing-features';
import { AdSlotCard } from './AdSlotCard';


export function AdSlotManagementTab() {
  const adSlotFeatures = React.useMemo(() => {
    return MARKETING_FEATURES.flatMap(group => 
      group.features
        .filter(feature => feature.key.includes('feature') || feature.key.includes('placement') || feature.key.includes('spotlight') || feature.key.includes('slot') || feature.key.includes('top') || feature.key.includes('banner'))
        .map(feature => {
            const entityType = feature.key.startsWith('shop:') ? 'manufacturer' : 'product';
            return {
                ...feature,
                slotId: feature.key.replace(/:/g, '-'),
                entityType: entityType
            }
        })
    );
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Ad Slot Overrides</CardTitle>
        <CardDescription>
          Pin specific products or manufacturers to promotional slots across the website. Overrides will take precedence over automatic selections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {adSlotFeatures.map(slot => (
           <AdSlotCard key={slot.slotId} slot={slot} />
        ))}
      </CardContent>
    </Card>
  );
}
