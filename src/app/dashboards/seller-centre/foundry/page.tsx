
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { PlusCircle, BarChart, Sparkles, Loader2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import NextImage from 'next/image';

type ForgingEvent = {
  id: string;
  productName: string;
  partnerId: string;
  partnerName?: string; // This will be populated after fetching
  status: 'active' | 'proposed' | 'finished' | 'declined';
  attributedSales?: number;
  endTime?: any;
};


export default function FoundryDashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [eventsWithPartners, setEventsWithPartners] = React.useState<ForgingEvent[]>([]);

  const eventsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'forgingEvents'), where('sellerId', '==', user.uid));
  }, [user, firestore]);

  const { data: events, isLoading: isLoadingEvents } = useCollection<ForgingEvent>(eventsQuery);

  React.useEffect(() => {
    if (events && firestore) {
      const fetchPartnerNames = async () => {
        const enhancedEvents = await Promise.all(
          events.map(async (event) => {
            if (event.partnerId) {
              const partnerDoc = await getDoc(doc(firestore, 'users', event.partnerId));
              if (partnerDoc.exists()) {
                return { ...event, partnerName: partnerDoc.data().fullName || 'Unnamed Partner' };
              }
            }
            return { ...event, partnerName: 'N/A' };
          })
        );
        setEventsWithPartners(enhancedEvents);
      };
      fetchPartnerNames();
    } else {
        setEventsWithPartners([]);
    }
  }, [events, firestore]);

  const isLoading = isLoadingEvents && eventsWithPartners.length === 0;

  const renderTableRows = () => {
    if (isLoading) {
      return Array.from({length: 2}).map((_, i) => (
        <TableRow key={`skel-${i}`}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-9 w-32" /></TableCell>
        </TableRow>
      ));
    }
    if (!eventsWithPartners || eventsWithPartners.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            You have not proposed or started any Deals.
          </TableCell>
        </TableRow>
      )
    }
    return eventsWithPartners.map(event => (
      <TableRow key={event.id}>
          <TableCell className="font-medium">{event.productName}</TableCell>
          <TableCell>{event.partnerName}</TableCell>
          <TableCell><Badge variant={event.status === 'active' ? 'default' : 'outline'}>{event.status}</Badge></TableCell>
          <TableCell>{event.endTime ? new Date(event.endTime?.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
          <TableCell>{event.attributedSales?.toLocaleString() || 0}</TableCell>
          <TableCell>
              <Button variant="outline" size="sm">
                  <BarChart className="mr-2 h-4 w-4" />
                  View Report
              </Button>
          </TableCell>
      </TableRow>
    ));
  }


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
            <BreadcrumbPage>The Foundry</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <NextImage src="https://i.postimg.cc/VkfCYdsM/image.png" alt="The Foundry Logo" width={32} height={32} />
                The Foundry: My Deals
              </CardTitle>
              <CardDescription>
                Create and manage collaborative deals with Growth
                Partners to forge amazing deals.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboards/seller-centre/foundry/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Propose New Deal
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Attributed Sales (KES)</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderTableRows()}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
