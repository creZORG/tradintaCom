
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EntityLookUp } from '@/components/marketing/discovery/EntityLookUp';
import { EntityModerationCard } from './discovery/EntityModerationCard';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { AdSlotManagementTab } from './AdSlotManagementTab';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Manufacturer } from '@/lib/definitions';
import { Skeleton } from '../ui/skeleton';

// Temporary debugging component to list all manufacturers
const AllManufacturersList = () => {
    const firestore = useFirestore();
    const manufacturersQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'manufacturers'));
    }, [firestore]);

    const { data: manufacturers, isLoading } = useCollection<Manufacturer>(manufacturersQuery);

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>DEV: All Manufacturers</CardTitle>
                <CardDescription>A list of all manufacturers in the database for easy lookup.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-64 overflow-y-auto">
                <ul className="space-y-1 text-sm font-mono">
                    {manufacturers?.map(mfg => (
                        <li key={mfg.id} className="text-xs">
                           <strong>{mfg.shopName}:</strong> ID: {mfg.id} | TradintaID: <span className="text-primary font-bold">{mfg.tradintaId}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

export default function SearchAndDiscoveryTab() {
    const [selectedEntity, setSelectedEntity] = React.useState<ProductWithRanking | null>(null);
    const [entityType, setEntityType] = React.useState<'product' | 'manufacturer'>('product');

    // Clear selection when type changes
    const handleTypeChange = (type: 'product' | 'manufacturer') => {
        setEntityType(type);
        setSelectedEntity(null);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Content Demotion</CardTitle>
                    <CardDescription>
                        Manually deboost an entity's ranking in search and discovery feeds. Look up an entity to view its current score and apply adjustments.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <Label htmlFor="entity-type">Entity Type</Label>
                            <Select value={entityType} onValueChange={(v) => handleTypeChange(v as any)}>
                                <SelectTrigger id="entity-type">
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product">Product</SelectItem>
                                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="lookup">Lookup by Name or ID</Label>
                            <EntityLookUp entityType={entityType} onEntitySelect={setSelectedEntity} />
                        </div>
                    </div>

                    {selectedEntity && (
                        <EntityModerationCard
                            key={selectedEntity.id} // Use key to force re-mount when entity changes
                            entity={selectedEntity}
                            entityType={entityType}
                        />
                    )}
                </CardContent>
            </Card>
            
            <AllManufacturersList />
            
            <Separator />

            <AdSlotManagementTab />
        </div>
    );
}
