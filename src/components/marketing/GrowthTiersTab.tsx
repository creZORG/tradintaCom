
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, setDoc } from 'firebase/firestore';
import { Edit, Save, Loader2, PlusCircle, Settings } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '../ui/dialog';
import { generateSlug } from '@/lib/utils';
import { MARKETING_FEATURES } from '@/lib/marketing-features';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';


type MarketingPlan = {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[]; // This will store the keys, e.g., 'shop:premium_badge'
    requiresSalesContact?: boolean;
};

const CreatePlanDialog = ({ onPlanCreated }: { onPlanCreated: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [planName, setPlanName] = React.useState('');
    const [planPrice, setPlanPrice] = React.useState('');

    const handleCreatePlan = async () => {
        if (!firestore || !planName || !planPrice) {
            toast({ title: "Name and Price are required.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const planId = generateSlug(planName);
            const newPlanRef = doc(firestore, 'marketingPlans', planId);
            await setDoc(newPlanRef, {
                id: planId,
                name: planName,
                price: Number(planPrice),
                currency: 'KES',
                features: [],
                requiresSalesContact: false,
            });
            toast({ title: "Plan Created!", description: `The plan "${planName}" has been successfully created.` });
            onPlanCreated();
            setOpen(false);
            setPlanName('');
            setPlanPrice('');
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to create plan: ' + error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Create New Plan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Growth Tier</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plan-name" className="text-right">Name</Label>
                        <Input id="plan-name" value={planName} onChange={e => setPlanName(e.target.value)} className="col-span-3" placeholder="e.g., Tradinta Boost" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plan-price" className="text-right">Price (KES)</Label>
                        <Input id="plan-price" type="number" value={planPrice} onChange={e => setPlanPrice(e.target.value)} className="col-span-3" placeholder="e.g., 5000" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleCreatePlan} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Plan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const FeatureTextEditor = ({ onSave }: { onSave: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    
    const featureTextsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'marketingFeatureTexts') : null, [firestore]);
    const { data, isLoading } = useDoc(featureTextsRef);
    
    const [editableTexts, setEditableTexts] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        const initialTexts: Record<string, string> = {};
        MARKETING_FEATURES.forEach(group => {
            group.features.forEach(feature => {
                initialTexts[feature.key] = data?.[feature.key] || feature.defaultText;
            });
        });
        setEditableTexts(initialTexts);
    }, [data]);

    const handleTextChange = (key: string, value: string) => {
        setEditableTexts(prev => ({...prev, [key]: value}));
    }
    
    const handleSaveChanges = async () => {
        if (!featureTextsRef) return;
        setIsSaving(true);
        try {
            await setDoc(featureTextsRef, editableTexts, { merge: true });
            toast({ title: "Feature descriptions updated successfully!" });
            onSave();
            setOpen(false);
        } catch (error: any) {
            toast({ title: "Error saving descriptions", description: error.message, variant: "destructive"});
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Edit Feature Descriptions</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Edit Marketing Feature Descriptions</DialogTitle>
                    <DialogDescription>
                        This text appears on the public marketing plans page. The underlying feature key remains the same.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
                    <div className="space-y-4">
                        {MARKETING_FEATURES.map(group => (
                            <div key={group.groupName}>
                                <h4 className="font-semibold text-sm mb-2">{group.groupName}</h4>
                                <div className="space-y-3 pl-2">
                                    {group.features.map(feature => (
                                        <div key={feature.key} className="grid gap-1">
                                            <Label htmlFor={feature.key} className="text-xs text-muted-foreground">{feature.key}</Label>
                                            <Textarea id={feature.key} value={editableTexts[feature.key] || ''} onChange={e => handleTextChange(feature.key, e.target.value)} className="text-sm" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Descriptions
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function GrowthTiersTab() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // --- Data Hooks ---
    const plansQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'marketingPlans')) : null, [firestore]);
    const { data: plans, isLoading: isLoadingPlans, forceRefetch: refetchPlans } = useCollection<MarketingPlan>(plansQuery);
    
    const featureTextsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'marketingFeatureTexts') : null, [firestore]);
    const { data: featureTexts, isLoading: isLoadingTexts, forceRefetch: refetchTexts } = useDoc(featureTextsRef);
    
    // --- State ---
    const [editablePlans, setEditablePlans] = React.useState<MarketingPlan[]>([]);
    const [isEditing, setIsEditing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const isLoading = isLoadingPlans || isLoadingTexts;

    React.useEffect(() => {
        if (plans) {
            setEditablePlans(plans);
        }
    }, [plans]);

    const getFeatureText = (key: string) => {
        return featureTexts?.[key] || MARKETING_FEATURES.flatMap(g => g.features).find(f => f.key === key)?.defaultText || key;
    }

    const handlePriceChange = (planId: string, newPrice: string) => {
        setEditablePlans(prev => prev.map(p => p.id === planId ? { ...p, price: Number(newPrice) } : p));
    };

    const handleCtaChange = (planId: string, requiresContact: boolean) => {
        setEditablePlans(prev => prev.map(p => p.id === planId ? { ...p, requiresSalesContact: requiresContact } : p));
    }

    const handleFeatureToggle = (planId: string, featureKey: string, isChecked: boolean) => {
         setEditablePlans(prev => prev.map(p => {
            if (p.id === planId) {
                const newFeatures = isChecked ? [...p.features, featureKey] : p.features.filter(f => f !== featureKey);
                return { ...p, features: [...new Set(newFeatures)] };
            }
            return p;
        }));
    }

    const handleSaveChanges = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            const batch = editablePlans.map(plan => {
                const planRef = doc(firestore, 'marketingPlans', plan.id);
                return setDoc(planRef, plan, { merge: true });
            });
            await Promise.all(batch);
            toast({ title: 'Success', description: 'Marketing plans have been updated.' });
            setIsEditing(false);
            refetchPlans();
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to save changes: ' + error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const onSave = () => {
        refetchPlans();
        refetchTexts();
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Tradinta Growth Tiers</CardTitle>
                        <CardDescription>Set pricing and manage the features included in each seller marketing plan.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <FeatureTextEditor onSave={onSave} />
                        <CreatePlanDialog onPlanCreated={refetchPlans} />
                        <Button onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : isEditing ? <Save className="mr-2 h-4 w-4"/> : <Edit className="mr-2 h-4 w-4"/>}
                            {isSaving ? 'Saving...' : isEditing ? 'Save All' : 'Edit All'}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                {isLoading ? Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-12 w-full mb-2"/>) 
                : editablePlans?.length > 0 ? editablePlans.map(plan => (
                    <AccordionItem value={plan.id} key={plan.id}>
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                                <span className="font-semibold text-lg">{plan.name}</span>
                                <div className="flex items-center gap-4">
                                     {isEditing ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`cta-${plan.id}`} className="text-xs font-normal">Requires Sales Contact</Label>
                                                <Switch id={`cta-${plan.id}`} checked={plan.requiresSalesContact} onCheckedChange={(checked) => handleCtaChange(plan.id, checked)} onClick={e => e.stopPropagation()} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`price-${plan.id}`} className="text-sm">Price (KES)</Label>
                                                <Input 
                                                    id={`price-${plan.id}`}
                                                    type="number" 
                                                    value={plan.price || ''} 
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={(e) => handlePriceChange(plan.id, e.target.value)}
                                                    className="w-32 h-9"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="font-bold text-lg text-primary">KES {plan.price?.toLocaleString() || 'Not Set'}</div>
                                    )}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 p-4">
                                {MARKETING_FEATURES.map(group => (
                                     <div key={group.groupName}>
                                        <h4 className="font-semibold mb-3">{group.groupName}</h4>
                                        <ul className="space-y-3">
                                            {group.features.map(feature => (
                                                <li key={feature.key} className="flex items-start gap-3">
                                                    <Checkbox
                                                        id={`${plan.id}-${feature.key}`}
                                                        checked={plan.features?.includes(feature.key)}
                                                        disabled={!isEditing}
                                                        onCheckedChange={checked => handleFeatureToggle(plan.id, feature.key, !!checked)}
                                                        className="mt-1"
                                                    />
                                                    <Label htmlFor={`${plan.id}-${feature.key}`} className="font-normal text-sm -mt-1">
                                                        {getFeatureText(feature.key)}
                                                    </Label>
                                                </li>
                                            ))}
                                        </ul>
                                     </div>
                                ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))
                : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No marketing plans have been created yet.</p>
                        <p className="text-sm">Click "Create New Plan" to get started.</p>
                    </div>
                )
                }
                </Accordion>
            </CardContent>
        </Card>
    );
};

    