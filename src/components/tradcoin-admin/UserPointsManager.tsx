
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { generateClaimCodes, findUserAndTheirPoints, banUserFromTradPoints, reversePointsByReason } from '@/app/dashboards/tradcoin-airdrop/actions';
import { awardPoints } from '@/lib/points';
import { Loader2, Ticket, Search, PlusCircle, AlertTriangle, Copy, Undo2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


type PointsLedgerEvent = {
    id: string;
    points: number;
    action: string;
    reason_code: string;
    created_at: any;
    metadata?: Record<string, any>;
};

type FoundUser = {
  id: string;
  fullName: string;
  totalPoints: number;
  ledger: PointsLedgerEvent[];
  tradintaId?: string;
  tradPointsStatus?: {
    isBanned: boolean;
    banReason?: string;
  };
}

const uniqueReasonCodes = (ledger: PointsLedgerEvent[]) => {
    const reasons = new Set(ledger.map(event => event.reason_code));
    return Array.from(reasons);
};

export default function UserPointsManager() {
    const auth = useAuth();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [generatedCodes, setGeneratedCodes] = React.useState<string[]>([]);
    
    // Search state
    const [searchIdentifier, setSearchIdentifier] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [foundUser, setFoundUser] = React.useState<FoundUser | null>(null);
    const [notFound, setNotFound] = React.useState(false);

    // Manual Award state
    const [awardPointsValue, setAwardPointsValue] = React.useState('');
    const [awardReason, setAwardReason] = React.useState('');
    const [awardNote, setAwardNote] = React.useState('');
    const [isAwarding, setIsAwarding] = React.useState(false);
    
    // Ban State
    const [isBanModalOpen, setIsBanModalOpen] = React.useState(false);
    const [banReason, setBanReason] = React.useState('');
    const [isProcessingBan, setIsProcessingBan] = React.useState(false);

    // Reversal State
    const [reversalReason, setReversalReason] = React.useState('');
    const [reversalStartDate, setReversalStartDate] = React.useState<Date | undefined>();
    const [reversalEndDate, setReversalEndDate] = React.useState<Date | undefined>();
    const [isReversing, setIsReversing] = React.useState(false);

    const handleUserSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setFoundUser(null);
        setNotFound(false);
        try {
            const result = await findUserAndTheirPoints(searchIdentifier);
            if(result.success) {
                setFoundUser(result.user);
            } else {
                setNotFound(true);
            }
        } catch (error: any) {
            toast({ title: "Search Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    }

    const handleGenerateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsGenerating(true);
        setGeneratedCodes([]);

        const formData = new FormData(event.currentTarget);
        const count = Number(formData.get('count'));
        const points = Number(formData.get('points'));
        const expiresAt = formData.get('expiresAt') ? new Date(formData.get('expiresAt') as string) : undefined;
        
        if (isNaN(count) || count <= 0 || isNaN(points) || points <= 0) {
            toast({ title: 'Invalid input', description: 'Please enter valid numbers for count and points.', variant: 'destructive' });
            setIsGenerating(false);
            return;
        }

        try {
            const result = await generateClaimCodes({ count, points, expiresAt });
            if(result.success && result.codes) {
                toast({ title: "Success!", description: `${result.codes.length} claim codes have been generated.`});
                setGeneratedCodes(result.codes);
            } else {
                throw new Error(result.message || 'Failed to generate codes.');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyGeneratedCodes = () => {
        navigator.clipboard.writeText(generatedCodes.join('\n'));
        toast({ title: 'Copied!', description: 'All generated codes copied to clipboard.' });
    };
    
    const handleAwardPoints = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !auth?.currentUser || !foundUser) {
            toast({ title: 'User not found or admin not authenticated', variant: 'destructive' });
            return;
        }
        if (!awardPointsValue || !awardReason) {
            toast({ title: 'All fields are required', variant: 'destructive' });
            return;
        }
        setIsAwarding(true);

        try {
            await awardPoints(
                firestore,
                foundUser.id,
                Number(awardPointsValue),
                awardReason,
                { admin_note: awardNote, issued_by: auth.currentUser.email }
            );

            toast({
                title: 'Points Awarded!',
                description: `${awardPointsValue} points awarded to ${foundUser.fullName}.`
            });
            
            handleUserSearch(e);
            
            setAwardPointsValue('');
            setAwardReason('');
            setAwardNote('');

        } catch (error: any) {
            toast({ title: 'Error Awarding Points', description: error.message, variant: 'destructive' });
        } finally {
            setIsAwarding(false);
        }
    };
    
    const handleBanUser = async () => {
        if (!foundUser) return;
        if (!banReason.trim()) {
            toast({ title: 'Reason is required to ban a user.', variant: 'destructive' });
            return;
        }
        setIsProcessingBan(true);
        try {
            const result = await banUserFromTradPoints({
                userId: foundUser.id,
                tradintaId: foundUser.tradintaId,
                reason: banReason,
                ban: true
            });
            if (result.success) {
                toast({ title: 'User Banned from TradPoints', description: `${foundUser.fullName} can no longer participate in the points program.` });
                handleUserSearch(new Event('submit') as any);
                setIsBanModalOpen(false);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
             toast({ title: 'Error', description: `Failed to ban user: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsProcessingBan(false);
        }
    };

    const handleUnbanUser = async () => {
        if (!foundUser) return;
        setIsProcessingBan(true);
        try {
            const result = await banUserFromTradPoints({
                userId: foundUser.id,
                tradintaId: foundUser.tradintaId,
                reason: '',
                ban: false
            });
            if (result.success) {
                toast({ title: 'User Reinstated', description: `${foundUser.fullName} can now participate in the points program again.` });
                handleUserSearch(new Event('submit') as any);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
             toast({ title: 'Error', description: `Failed to reinstate user: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsProcessingBan(false);
        }
    };

    const handleReversePoints = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foundUser || !reversalReason) {
            toast({ title: 'Please select a reason to reverse.', variant: 'destructive'});
            return;
        }
        setIsReversing(true);
        try {
            const result = await reversePointsByReason({
                userId: foundUser.id,
                reasonCode: reversalReason,
                startDate: reversalStartDate,
                endDate: reversalEndDate,
                adminEmail: auth?.currentUser?.email || 'unknown-admin',
            });

            if (result.success) {
                toast({ title: 'Points Reversed!', description: `${result.pointsReversed} points have been deducted.`});
                handleUserSearch(e);
                setReversalReason('');
                setReversalStartDate(undefined);
                setReversalEndDate(undefined);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: `Failed to reverse points: ${error.message}`, variant: 'destructive'});
        } finally {
            setIsReversing(false);
        }
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Manual Point Adjustments & User Management</CardTitle><CardDescription>Search for a user by email or Tradinta ID to view their points ledger and make adjustments.</CardDescription></CardHeader>
                <CardContent>
                    <form onSubmit={handleUserSearch} className="flex items-center gap-2 mb-4">
                        <Input placeholder="Search by Email or Tradinta ID..." value={searchIdentifier} onChange={e => setSearchIdentifier(e.target.value)} />
                        <Button type="submit" disabled={isSearching}>
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </form>
                    {isSearching && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                    {notFound && <div className="text-center p-8 text-muted-foreground">User not found.</div>}
                    {foundUser && (
                        <div className="mt-6 space-y-6">
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{foundUser.fullName}</span>
                                        <div className="flex items-center gap-2">
                                            {foundUser.tradPointsStatus?.isBanned && <Badge variant="destructive">Banned</Badge>}
                                            <Badge>{foundUser.totalPoints.toLocaleString()} Points</Badge>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="font-semibold mb-2 text-sm">Points History</h4>
                                     <ScrollArea className="h-64 pr-4">
                                        <Table>
                                            <TableBody>
                                                {foundUser.ledger.length > 0 ? foundUser.ledger.map(event => (
                                                    <TableRow key={event.id}>
                                                        <TableCell>
                                                            <p className="font-medium text-xs capitalize">{event.reason_code.replace(/_/g, ' ')}</p>
                                                            <p className="text-xs text-muted-foreground">{event.created_at ? new Date(event.created_at.seconds * 1000).toLocaleString() : ''}</p>
                                                        </TableCell>
                                                        <TableCell className={`font-semibold text-right ${event.points >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                                            {event.points >= 0 ? `+${event.points}` : event.points}
                                                        </TableCell>
                                                    </TableRow>
                                                )) : <TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">No transaction history.</TableCell></TableRow>}
                                            </TableBody>
                                        </Table>
                                     </ScrollArea>
                                </CardContent>
                                 <CardFooter>
                                    {foundUser.tradPointsStatus?.isBanned ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="secondary" className="w-full">Reinstate User</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will allow {foundUser.fullName} to earn and spend TradPoints again. Their referral code will need to be manually reactivated if applicable.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleUnbanUser} disabled={isProcessingBan}>
                                                        {isProcessingBan && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                        Confirm Reinstatement
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <Dialog open={isBanModalOpen} onOpenChange={setIsBanModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive" className="w-full">
                                                    <AlertTriangle className="mr-2 h-4 w-4" /> Ban from TradPoints
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Ban {foundUser.fullName} from TradPoints?</DialogTitle>
                                                    <DialogDescription>The user will no longer be able to earn or spend points, and their referral code will be voided. This action is reversible.</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-2 py-4">
                                                    <Label htmlFor="ban-reason">Reason for Ban</Label>
                                                    <Textarea id="ban-reason" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="e.g., Abuse of referral system." />
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsBanModalOpen(false)}>Cancel</Button>
                                                    <Button variant="destructive" onClick={handleBanUser} disabled={isProcessingBan}>
                                                        {isProcessingBan && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                        Confirm Ban
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </CardFooter>
                            </Card>
                            <Separator />
                            <form onSubmit={handleAwardPoints}>
                                <CardContent className="space-y-4 pt-6">
                                    <h4 className="font-semibold">Grant Points</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label htmlFor="award-points">Points to Award</Label><Input id="award-points" type="number" placeholder="e.g. 500" value={awardPointsValue} onChange={e => setAwardPointsValue(e.target.value)} required /></div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="award-reason">Reason</Label>
                                            <Select onValueChange={setAwardReason} value={awardReason} required><SelectTrigger id="award-reason"><SelectValue placeholder="Select reason" /></SelectTrigger><SelectContent><SelectItem value="PROMOTIONAL_GIFT">Promotional Gift</SelectItem><SelectItem value="MANUAL_CORRECTION">Manual Correction</SelectItem></SelectContent></Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2"><Label htmlFor="award-note">Admin Note (Optional)</Label><Input id="award-note" placeholder="e.g., Winner of Q4 Campaign" value={awardNote} onChange={e => setAwardNote(e.target.value)} /></div>
                                </CardContent>
                                <CardFooter><Button className="w-full" type="submit" disabled={isAwarding}>{isAwarding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}Award Points</Button></CardFooter>
                            </form>
                             <Separator />
                             <form onSubmit={handleReversePoints}>
                                <CardContent className="space-y-4 pt-6">
                                    <h4 className="font-semibold text-destructive">Manual Point Reversal</h4>
                                    <div className="grid gap-2">
                                        <Label htmlFor="reversal-reason">Reverse Points for Reason</Label>
                                        <Select onValueChange={setReversalReason} value={reversalReason} required>
                                            <SelectTrigger id="reversal-reason"><SelectValue placeholder="Select a reason code to reverse..." /></SelectTrigger>
                                            <SelectContent>
                                                {uniqueReasonCodes(foundUser.ledger).map(code => (
                                                    <SelectItem key={code} value={code}>{code.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Start Date (Optional)</Label>
                                            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("justify-start text-left font-normal", !reversalStartDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{reversalStartDate ? format(reversalStartDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={reversalStartDate} onSelect={setReversalStartDate} initialFocus /></PopoverContent></Popover>
                                        </div>
                                         <div className="grid gap-2">
                                            <Label>End Date (Optional)</Label>
                                            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("justify-start text-left font-normal", !reversalEndDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{reversalEndDate ? format(reversalEndDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={reversalEndDate} onSelect={setReversalEndDate} initialFocus /></PopoverContent></Popover>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="destructive" className="w-full" type="submit" disabled={isReversing}>
                                        {isReversing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Undo2 className="mr-2 h-4 w-4" />}
                                        Reverse Points
                                    </Button>
                                </CardFooter>
                             </form>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Generate New Claim Codes</CardTitle></CardHeader>
                <form onSubmit={handleGenerateSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="grid gap-2"><Label htmlFor="count">Number of Codes</Label><Input id="count" name="count" type="number" placeholder="e.g. 50" required /></div>
                            <div className="grid gap-2"><Label htmlFor="points">Points per Code</Label><Input id="points" name="points" type="number" placeholder="e.g. 100" required /></div>
                            <div className="grid gap-2"><Label htmlFor="expiresAt">Expires On (Optional)</Label><Input id="expiresAt" name="expiresAt" type="date" /></div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2" />}
                            {isGenerating ? 'Generating...' : 'Generate Codes'}
                        </Button>
                    </CardFooter>
                </form>
                {generatedCodes.length > 0 && (
                    <CardContent>
                         <Separator className="my-4" />
                         <div className="space-y-2">
                             <h4 className="font-semibold text-destructive">New Codes Generated</h4>
                             <p className="text-xs text-muted-foreground">
                                 The following codes have been created. Copy them now, as you will not be able to see them again.
                             </p>
                             <Textarea readOnly value={generatedCodes.join('\n')} className="h-48 font-mono text-xs" />
                             <Button onClick={copyGeneratedCodes} variant="outline" size="sm">
                                 <Copy className="mr-2 h-4 w-4" /> Copy Codes
                             </Button>
                         </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
