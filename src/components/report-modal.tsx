
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, Flag } from 'lucide-react';
import { nanoid } from 'nanoid';
import { createSystemAlert } from '@/lib/system-alerts';

interface ReportModalProps {
  reportType: 'Product' | 'Review' | 'Shop' | 'Order';
  referenceId: string;
  productName?: string; // Optional product name for context
  children: React.ReactNode;
}

const reportReasons = {
    Product: ['Inaccurate Information', 'Prohibited Item', 'Intellectual Property Violation', 'Offensive Content'],
    Review: ['Spam or Fake', 'Harassment', 'Inappropriate Content', 'Not Relevant'],
    Shop: ['Suspicious/Fraudulent Activity', 'Impersonation', 'Selling Prohibited Items', 'Intellectual Property Violation'],
    Order: ['Item Not Received', 'Item Not as Described', 'Seller Unresponsive', 'Billing Issue', 'Other'],
};


export function ReportModal({
  reportType,
  referenceId,
  productName,
  children,
}: ReportModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !firestore) {
      toast({
        title: 'Please log in',
        description: 'You must be logged in to submit a report.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const reason = formData.get('reason') as string;
    const details = formData.get('details') as string;
    
    if (!reason) {
        toast({ title: 'Please select a reason for your report.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    try {
      // For orders, we create a 'Dispute'. For others, we create a 'Report'.
      const collectionName = reportType === 'Order' ? 'disputes' : 'reports';
      
      const reportData: any = {
        id: nanoid(),
        reporterId: user.uid,
        reporterName: user.displayName || 'Anonymous',
        reportType,
        referenceId,
        reason,
        details,
        status: 'Open',
        createdAt: serverTimestamp(),
      };
      
      // If it's a dispute, add seller/buyer info
      if (reportType === 'Order') {
        const orderDoc = await firestore.collection('orders').doc(referenceId).get();
        if (orderDoc.exists()) {
            const orderData = orderDoc.data();
            reportData.buyerId = orderData?.buyerId;
            reportData.buyerName = orderData?.buyerName;
            reportData.sellerId = orderData?.sellerId;
            reportData.sellerName = orderData?.sellerName;
            reportData.orderId = referenceId; // Explicitly set for disputes
        }
      }

      await addDocumentNonBlocking(collection(firestore, collectionName), reportData);

      // Create a system alert to notify admins
      const alertType = reportType === 'Order' ? 'NEW_DISPUTE' : 'NEW_USER_REPORT';
      await createSystemAlert(
          firestore,
          alertType,
          'info',
          `New ${reportType} submitted for ID: ${referenceId}`,
          { reportId: reportData.id, referenceId, reportType }
      );
      
      toast({
        title: `${reportType} Submitted`,
        description: `Thank you. Our team will review your report regarding ${reportType} ID: ${referenceId}.`,
      });
      setOpen(false);

    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const titleText = reportType === 'Order' ? 'Raise a Dispute' : 'Report Content';
  const descriptionText = reportType === 'Order'
    ? `Create a formal dispute for Order ID: ${referenceId}. Our support team will mediate.`
    : `Report a ${reportType.toLowerCase()} that violates Tradinta's policies.`;


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive"/> {titleText}
          </DialogTitle>
          <DialogDescription>
            {descriptionText}
            {productName && ` For product: "${productName}".`} Your report is confidential.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for reporting</Label>
              <Select name="reason" required>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportReasons[reportType].map(reason => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="details">
                Additional Details
              </Label>
              <Textarea
                id="details"
                name="details"
                placeholder="Please provide any additional information or context that could help our team."
                className="min-h-24"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} 
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    