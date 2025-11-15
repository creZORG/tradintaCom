
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductWithRanking } from '@/services/DiscoveryEngine.d';
import { lookupEntity } from '@/app/lib/actions/discovery';

interface EntityLookUpProps {
  onEntitySelect: (entity: ProductWithRanking | null) => void;
  entityType: 'product' | 'manufacturer';
}

export function EntityLookUp({ onEntitySelect, entityType }: EntityLookUpProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({ title: 'Please enter a search query.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    onEntitySelect(null);

    try {
      const result = await lookupEntity(entityType, searchQuery);

      if (result) {
        onEntitySelect(result);
      } else {
        toast({ title: 'Not Found', description: `No ${entityType} found matching "${searchQuery}".` });
      }
      
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="lookup"
          placeholder={`Search by ${entityType === 'product' ? 'Product' : 'Manufacturer'} Name or ID...`}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Lookup
      </Button>
    </form>
  );
}
