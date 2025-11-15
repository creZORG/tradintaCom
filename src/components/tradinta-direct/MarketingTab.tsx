
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { Loader2, PlusCircle, Handshake } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { addDoc } from 'firebase/firestore';

type Partner = {
  id: string;
  fullName: string;
};

const CreatePromoDialog = ({ onPromoCreated }: { onPromoCreated: () => void }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [assignedPartner, setAssignedPartner] = React.useState('');
    const [myNetwork] = useLocalStorageState<Partner[]>('my-partner-network', []);
    
    const partnerOptions = myNetwork.map(p => ({ value: p.id, label: p.fullName }));

    const handleCreatePromo = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !firestore) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const promoCode = formData.get('promoCode') as string;
        const discountType = formData.get('discountType') as string;
        const discountValue = Number(formData.get('discountValue'));
        const expiresAt = formData.get('expiresAt') ? new Date(formData.get('expiresAt') as string) : null;

        if (!name || !promoCode || !discountType || isNaN(discountValue)) {
            toast({ title: "Please fill all required fields.", variant: "destructive"});
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(firestore, 'manufacturers', user.uid, 'marketingCampaigns'), {
                id: nanoid(),
                name,
                type: 'B2C_DIRECT',
                promoCode,
                discountType,
                discountValue,
                status: 'active',
                expiresAt,
                assignedPartnerId: assignedPartner || null,
                usageCount: 0,
            });
            toast({ title: "Promotion created!", description: `The promo code ${promoCode} is now active.` });
            onPromoCreated();
            setOpen(false);
        } catch (error: any) {
            toast({ title: "Error creating promotion", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> New Promotion</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New B2C Promotion</DialogTitle>
                    <DialogDescription>Create a discount code for your Tradinta Direct products.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePromo}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label htmlFor="name">Campaign Name</Label><Input id="name" name="name" placeholder="e.g., Holiday Sale 2024" required /></div>
                        <div className="grid gap-2"><Label htmlFor="promoCode">Promo Code</Label><Input id="promoCode" name="promoCode" placeholder="e.g., SAVE15" required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="discountType">Discount Type</Label>
                                <Select name="discountType" defaultValue="percentage"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount (KES)</SelectItem></SelectContent></Select>
                            </div>
                             <div className="grid gap-2"><Label htmlFor="discountValue">Value</Label><Input id="discountValue" name="discountValue" type="number" placeholder="e.g., 15" required /></div>
                        </div>
                        <div className="grid gap-2"><Label htmlFor="expiresAt">Expires On (Optional)</Label><Input id="expiresAt" name="expiresAt" type="date" /></div>
                        <div className="grid gap-2">
                            <Label>Assign to Growth Partner (Optional)</Label>
                            <Combobox options={partnerOptions} value={assignedPartner} onValueChange={setAssignedPartner} placeholder="Select a partner from your network..." emptyMessage="No partners in your network." />
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Create Promotion
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function MarketingTab() {
  const { user } = useUser();
  const firestore = useFirestore();

  const promosQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(firestore, 'manufacturers', user.uid, 'marketingCampaigns'),
      where('type', '==', 'B2C_DIRECT')
    );
  }, [firestore, user]);

  const {
    data: promotions,
    isLoading: isLoadingPromos,
    forceRefetch: refetchPromos,
  } = useCollection(promosQuery);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Promotions & Campaigns</CardTitle>
            <CardDescription>
              Create discount codes and track their performance for your B2C sales.
            </CardDescription>
          </div>
          <CreatePromoDialog onPromoCreated={refetchPromos} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Promo Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Partner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingPromos ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : promotions && promotions.length > 0 ? (
              promotions.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.promoCode}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.discountType === 'percentage'
                      ? `${p.discountValue}%`
                      : `KES ${p.discountValue}`}
                  </TableCell>
                  <TableCell>
                    <Badge>{p.status}</Badge>
                  </TableCell>
                  <TableCell>{p.usageCount || 0}</TableCell>
                  <TableCell>
                    {p.assignedPartnerId ? (
                      <Handshake className="w-4 h-4" />
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No B2C promotions created yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
