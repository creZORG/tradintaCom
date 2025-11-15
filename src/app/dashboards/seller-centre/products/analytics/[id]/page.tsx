'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart2,
  DollarSign,
  Eye,
  ShoppingCart,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

type ProductData = {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
  status: 'draft' | 'published' | 'archived';
};

const salesData = [
  { name: 'Jan', views: 2500, sales: 12 },
  { name: 'Feb', views: 3200, sales: 18 },
  { name: 'Mar', views: 2800, sales: 15 },
  { name: 'Apr', views: 4100, sales: 25 },
  { name: 'May', views: 3800, sales: 22 },
  { name: 'Jun', views: 5500, sales: 34 },
];


export default function ProductAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const productDocRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore || !productId) return null;
    return doc(firestore, 'manufacturers', user.uid, 'products', productId);
  }, [firestore, user, productId]);

  const { data: product, isLoading } = useDoc<ProductData>(productDocRef);

  const handleDelete = async () => {
    if (!productDocRef) return;
    setIsDeleting(true);
    try {
      await deleteDoc(productDocRef);
      toast({
        title: 'Product Deleted',
        description: 'The product has been permanently deleted.',
        variant: 'destructive',
      });
      router.push('/dashboards/seller-centre/products');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to delete product: ${error.message}`,
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </div>
    )
  }

  if (!product) {
    return (
        <div>
            <h1 className="text-xl font-semibold">Product not found.</h1>
            <p className="text-muted-foreground">The requested product could not be loaded.</p>
             <Button variant="link" asChild><Link href="/dashboards/seller-centre/products">Go Back</Link></Button>
        </div>
    )
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
            <BreadcrumbLink asChild>
              <Link href="/dashboards/seller-centre/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Analytics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboards/seller-centre/products">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="relative w-16 h-16 rounded-md overflow-hidden">
            <Image src={product.imageUrl || 'https://placehold.co/64x64'} alt={product.name} fill className="object-cover" />
        </div>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {product.name}
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  product and remove all its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button asChild size="sm">
            <Link href={`/dashboards/seller-centre/products/edit/${product.id}`}>
              <Edit className="mr-2" /> Edit Product
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+235</div>
            <p className="text-xs text-muted-foreground">+18.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,234</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.92%</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Monthly views and sales for this product.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" label={{ value: 'Views', angle: -90, position: 'insideLeft' }}/>
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" label={{ value: 'Sales', angle: -90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="views" fill="hsl(var(--primary))" name="Product Views" />
                    <Bar yAxisId="right" dataKey="sales" fill="hsl(var(--accent))" name="Units Sold" />
                </ComposedChart>
            </ResponsiveContainer>
        </CardContent>
       </Card>
    </div>
  );
}
