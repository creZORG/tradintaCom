
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Loader2,
  Package,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  UploadCloud,
  Check,
  X,
  Landmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  useDoc,
  useFirestore,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PhotoUpload } from '@/components/ui/photo-upload';

type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
};

type Order = {
  id: string;
  buyerName?: string;
  buyerId?: string;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentTerm?: string;
  status: string;
  orderDate: any; // Firestore timestamp
  items?: OrderItem[];
  lpoUrl?: string;
  bankGuaranteeUrl?: string;
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null | React.ReactNode;
}) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-semibold">{value || 'N/A'}</p>
  </div>
);

export default function B2BOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = React.useState(false);

  const orderDocRef = useMemoFirebase(() => {
    if (!firestore || !orderId) return null;
    return doc(firestore, 'orders', orderId);
  }, [firestore, orderId]);

  const { data: order, isLoading } = useDoc<Order>(orderDocRef);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!orderDocRef) return;
    setIsProcessing(true);
    try {
      await updateDocumentNonBlocking(orderDocRef, {
        status: newStatus,
        lastUpdate: serverTimestamp(),
      });
      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update order status.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!order) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">Order Not Found</h1>
        <p>This order does not exist or you do not have permission to view it.</p>
      </div>
    );
  }

  const orderDate = order.orderDate
    ? new Date(order.orderDate.seconds * 1000).toLocaleString()
    : 'N/A';
  const amountPaid = order.amountPaid || 0;
  const balanceDue = order.balanceDue === undefined ? order.totalAmount - amountPaid : order.balanceDue;

  const renderActionCard = () => {
    switch (order.status) {
      case 'Pending LPO Confirmation':
        return (
          <Card className="border-amber-500">
            <CardHeader><CardTitle className="text-amber-600 flex items-center gap-2"><AlertTriangle /> Action Required: Review LPO</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">The buyer has uploaded a Local Purchase Order. Review it and either accept to begin fulfillment or reject it.</p>
              {order.lpoUrl && <Button asChild variant="secondary"><a href={order.lpoUrl} target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" /> View Uploaded LPO</a></Button>}
            </CardContent>
            <CardFooter className="gap-2">
              <Button onClick={() => handleUpdateStatus('Processing')} disabled={isProcessing}><Check className="mr-2 h-4 w-4" /> Accept LPO</Button>
              <Button variant="destructive" onClick={() => handleUpdateStatus('Cancelled')} disabled={isProcessing}><X className="mr-2 h-4 w-4" /> Reject LPO</Button>
            </CardFooter>
          </Card>
        );
      case 'Awaiting Bank Guarantee Confirmation':
         return (
          <Card className="border-amber-500">
            <CardHeader><CardTitle className="text-amber-600 flex items-center gap-2"><Landmark /> Action Required: Review Bank Guarantee</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">The buyer has uploaded a Bank Guarantee. Please review the document for validity.</p>
              {order.bankGuaranteeUrl && <Button asChild variant="secondary"><a href={order.bankGuaranteeUrl} target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" /> View Guarantee</a></Button>}
            </CardContent>
            <CardFooter className="gap-2">
              <Button onClick={() => handleUpdateStatus('Processing')} disabled={isProcessing}><Check className="mr-2 h-4 w-4" /> Accept Guarantee</Button>
              <Button variant="destructive" onClick={() => handleUpdateStatus('Cancelled')} disabled={isProcessing}><X className="mr-2 h-4 w-4" /> Reject Guarantee</Button>
            </CardFooter>
          </Card>
         );
      default:
        return null;
    }
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
            <BreadcrumbLink asChild>
              <Link href="/dashboards/seller-centre/orders">B2B Orders</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Order Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboards/seller-centre/orders">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Order #{order.id.substring(0, 8)}
        </h1>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {order.status}
        </Badge>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Buyer
          </Button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
           {renderActionCard()}
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.items?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={item.productName}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={item.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                          width="64"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>KES {item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        KES {(item.quantity * item.unitPrice).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem label="Order ID" value={order.id} />
              <DetailItem label="Order Date" value={orderDate} />
              <DetailItem label="Buyer" value={order.buyerName} />
              <DetailItem label="Payment Term" value={order.paymentTerm?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Full Payment'} />
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle>Financials</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                <DetailItem label="Total Amount" value={`KES ${order.totalAmount.toLocaleString()}`} />
                <DetailItem label="Amount Paid" value={`KES ${amountPaid.toLocaleString()}`} />
                {balanceDue > 0 && <DetailItem label="Balance Due" value={<span className="font-bold text-destructive">KES {balanceDue.toLocaleString()}</span>} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
