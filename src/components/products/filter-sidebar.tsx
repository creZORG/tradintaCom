
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { kenyanCounties } from '@/lib/countries';
import { Slider } from '@/components/ui/slider';
import { type ProductCategory, getProductCategories } from '@/app/lib/data';
import { Skeleton } from '../ui/skeleton';


type FilterState = {
    category: string;
    subcategory: string;
    verifiedOnly: boolean;
    minPrice: string;
    maxPrice: string;
    county: string;
    moq: string;
    moqRange: string;
    rating: string;
};

interface FilterSidebarProps {
    filters: FilterState;
    onFilterChange: (name: keyof FilterState, value: any) => void;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    activeTab: 'for-you' | 'following' | 'direct';
}

export function FilterSidebar({
    filters,
    onFilterChange,
    onApplyFilters,
    onResetFilters,
    activeTab
}: FilterSidebarProps) {
    
    const [allCategories, setAllCategories] = React.useState<ProductCategory[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);

    React.useEffect(() => {
        async function fetchCategories() {
            const cats = await getProductCategories();
            setAllCategories(cats);
            setIsLoadingCategories(false);
        }
        fetchCategories();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange(e.target.name as keyof FilterState, e.target.value);
    };

    const handleCheckboxChange = (name: keyof FilterState, checked: boolean) => {
        onFilterChange(name, checked);
    };
    
    const isB2B = activeTab !== 'direct';
    
    const selectedCategory = React.useMemo(() => {
        return allCategories.find(c => c.name === filters.category);
    }, [allCategories, filters.category]);

    return (
        <div className="bg-background border rounded-2xl shadow-lg sticky top-24">
            <form id="filter-form" className="p-4 space-y-3">
                
                 <Accordion type="multiple" className="w-full space-y-3" defaultValue={['location']}>
                    <div 
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleCheckboxChange('verifiedOnly', !filters.verifiedOnly)}
                    >
                        <Checkbox id="verifiedOnly" checked={filters.verifiedOnly} />
                        <Label htmlFor="verifiedOnly" className="font-medium text-sm flex items-center gap-2 cursor-pointer">
                            <ShieldCheck className="w-5 h-5 text-green-600"/> Verified Sellers Only
                        </Label>
                    </div>
                    <AccordionItem value="price-range" className="border rounded-lg overflow-hidden">
                       <AccordionTrigger className="text-sm font-medium py-3 px-4 bg-transparent hover:no-underline">Price Range (KES)</AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                             <div className="flex items-center gap-2 pt-2">
                                <Input name="minPrice" placeholder="Min" type="number" value={filters.minPrice} onChange={handleInputChange} className="rounded-lg text-center"/>
                                <span className="text-muted-foreground">-</span>
                                <Input name="maxPrice" placeholder="Max" type="number" value={filters.maxPrice} onChange={handleInputChange} className="rounded-lg text-center"/>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    {isB2B && (
                        <AccordionItem value="moq" className="border rounded-lg overflow-hidden">
                            <AccordionTrigger className="text-sm font-medium py-3 px-4 bg-transparent hover:no-underline">Minimum Order Qty (MOQ)</AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                                <div className="space-y-4 pt-2">
                                    <Input name="moq" placeholder="e.g. 100" type="number" value={filters.moq} onChange={handleInputChange} className="rounded-lg"/>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <Label>Search Range</Label>
                                            <span className="font-semibold">within ± {filters.moqRange} units</span>
                                        </div>
                                        <Slider
                                            name="moqRange"
                                            defaultValue={[Number(filters.moqRange)]}
                                            onValueChange={(value) => onFilterChange('moqRange', String(value[0]))}
                                            max={500}
                                            step={10}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    <AccordionItem value="location" className="border rounded-lg overflow-hidden">
                        <AccordionTrigger className="text-sm font-medium py-3 px-4 bg-transparent hover:no-underline">Seller Location</AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                            <div className="pt-2">
                                <Select name="county" value={filters.county} onValueChange={(value) => onFilterChange('county', value)}>
                                    <SelectTrigger className="rounded-lg"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Counties</SelectItem>
                                        {kenyanCounties.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>
                
                 <div className="pt-2 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={onResetFilters} className="text-xs">
                        <RefreshCw className="mr-2 h-3 w-3"/> Reset
                    </Button>
                    <Button type="button" onClick={onApplyFilters} className="w-full rounded-lg">Apply</Button>
                </div>
            </form>
        </div>
    );
}
