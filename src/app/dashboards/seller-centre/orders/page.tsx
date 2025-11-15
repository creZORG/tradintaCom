
'use client';

import * as React from 'react';
import Link from 'next/link';
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
import {
  Eye,
  Loader2,
  Package,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type Order = {
    id: string;
    buyerName?: string;
    totalAmount: number;
    status: string;
    orderDate: any; // Firestore timestamp
    items?: { productName: string }[];
};

export default function B2BOrdersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'orders'),
      where('sellerId', '==', user.uid),
      where('isTradintaDirect', '!=', true),
      orderBy('isTradintaDirect', 'asc'), // this is a trick to use a different inequality
      orderBy('orderDate', 'desc')
    );
  }, [user, firestore]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const getOrderDescription = (order: Order) => {
    if (order.items && order.items.length > 0) {
        const firstItem = order.items[0].productName;
        return order.items.length > 1 ? `${firstItem} + ${order.items.length - 1} more` : firstItem;
    }
    return order.productName || 'Order Details';
  }

  const renderOrderRows = () => {
      if (isLoading) {
          return Array.from({length: 5}).map((_, i) => (
               <TableRow key={`skel-${i}`}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-9 w-28" /></TableCell>
            </TableRow>
          ))
      }
      if (!orders || orders.length === 0) {
          return <TableRow><TableCell colSpan={6} className="h-24 text-center">No B2B orders found.</TableCell></TableRow>
      }
      return orders.map(order => (
          <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.id}</TableCell>
              <TableCell>{order.buyerName || 'Tradinta Buyer'}</TableCell>
              <TableCell>{getOrderDescription(order)}</TableCell>
              <TableCell>KES {order.totalAmount.toLocaleString()}</TableCell>
              <TableCell><Badge>{order.status}</Badge></TableCell>
              <TableCell>
                  <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboards/seller-centre/orders/${order.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Order
                      </Link>
                  </Button>
              </TableCell>
          </TableRow>
      ));
  };

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
            <BreadcrumbPage>B2B Orders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            B2B Order Management
          </CardTitle>
          <CardDescription>
            View and fulfill your direct business-to-business orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Product(s)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {renderOrderRows()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
