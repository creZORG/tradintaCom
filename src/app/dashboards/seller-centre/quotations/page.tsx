
'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookCopy, Eye, Archive, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { logFeatureUsage } from '@/lib/analytics';

type Quotation = {
    id: string;
    buyerName: string;
    productName: string;
    quantity: number;
    createdAt: any;
    status: 'New' | 'Responded' | 'Accepted' | 'Archived';
}

const getStatusBadge = (status: Quotation['status']) => {
  switch (status) {
    case 'New':
      return <Badge variant="default">{status}</Badge>;
    case 'Responded':
      return <Badge variant="secondary">{status}</Badge>;
    case 'Accepted':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">{status}</Badge>;
    case 'Archived':
      return <Badge variant="outline">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const QuotationTable = ({ filterStatus, quotations, isLoading, onUpdate }: { 
    filterStatus: 'all' | 'New' | 'Responded' | 'Accepted' | 'Archived', 
    quotations: Quotation[] | null,
    isLoading: boolean,
    onUpdate: (id: string, status: 'Archived') => void
}) => {
  const { user, role } = useUser();
  const handleFeatureClick = (feature: string, metadata?: Record<string, any>) => {
    if (user && role) {
      logFeatureUsage({ feature, userId: user.uid, userRole: role, metadata });
    }
  };
  
  const filteredQuotes =
    filterStatus === 'all'
      ? quotations
      : quotations?.filter(
          (q) => q.status.toLowerCase() === filterStatus.toLowerCase()
        ) || [];

    if (isLoading) {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({length: 3}).map((_, i) => (
                        <TableRow key={`skel-row-${i}`}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Buyer</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredQuotes.length > 0 ? (
          filteredQuotes.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="font-medium">{quote.buyerName}</TableCell>
              <TableCell>{quote.productName}</TableCell>
              <TableCell>{quote.quantity}</TableCell>
              <TableCell>{quote.createdAt ? new Date(quote.createdAt?.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>{getStatusBadge(quote.status)}</TableCell>
              <TableCell className="space-x-2">
                 <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboards/seller-centre/quotations/${quote.id}`} onClick={() => handleFeatureClick('quotations:view_details', { quotationId: quote.id })}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </Button>
                {quote.status !== 'Archived' && (
                    <Button variant="ghost" size="sm" onClick={() => {
                        onUpdate(quote.id, 'Archived');
                        handleFeatureClick('quotations:archive', { quotationId: quote.id });
                    }}>
                        <Archive className="mr-2 h-4 w-4" /> Archive
                    </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No quotations in this category.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default function SellerQuotationsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const quotationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'manufacturers', user.uid, 'quotations'), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: quotations, isLoading } = useCollection<Quotation>(quotationsQuery);

    const handleUpdateStatus = async (id: string, status: 'Archived') => {
        if (!user || !firestore) return;
        const quoteRef = doc(firestore, 'manufacturers', user.uid, 'quotations', id);
        try {
            await updateDocumentNonBlocking(quoteRef, { status });
            toast({
                title: 'Quotation Updated',
                description: `The status has been set to ${status}.`
            });
        } catch (error: any) {
            toast({
                title: 'Update Failed',
                description: error.message,
                variant: 'destructive',
            })
        }
    };
    
    const newQuotesCount = useMemo(() => {
        return quotations?.filter(q => q.status === 'New').length || 0;
    }, [quotations]);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboards/seller-centre">Seller Centre</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Quotations</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookCopy className="w-6 h-6 text-primary" />
            Requests for Quotation (RFQs)
          </CardTitle>
          <CardDescription>
            View and respond to inquiries and price requests from potential buyers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New ({newQuotesCount})</TabsTrigger>
              <TabsTrigger value="responded">Responded</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <QuotationTable filterStatus="all" quotations={quotations} isLoading={isLoading} onUpdate={handleUpdateStatus}/>
            </TabsContent>
            <TabsContent value="new">
              <QuotationTable filterStatus="New" quotations={quotations} isLoading={isLoading} onUpdate={handleUpdateStatus}/>
            </TabsContent>
            <TabsContent value="responded">
              <QuotationTable filterStatus="Responded" quotations={quotations} isLoading={isLoading} onUpdate={handleUpdateStatus}/>
            </TabsContent>
            <TabsContent value="archived">
              <QuotationTable filterStatus="Archived" quotations={quotations} isLoading={isLoading} onUpdate={handleUpdateStatus}/>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
