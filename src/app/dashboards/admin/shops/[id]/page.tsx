
'use client';

import * as React from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCheck, Star, Loader2, AlertTriangle, Package, Search, ListFilter, MoreHorizontal, Edit, BarChart2, Eye, Copy } from "lucide-react";
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SuspendShopModal } from '@/components/suspend-shop-modal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type Manufacturer = {
    id: string;
    shopName: string;
    email: string;
    industry?: string;
    registrationDate: any;
    verificationStatus: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified' | 'Restricted' | 'Suspended';
    suspensionDetails?: {
        isSuspended: boolean;
        reason: string;
        prohibitions: string[];
        publicDisclaimer: boolean;
      };
    rating?: number;
    sales?: number; // mock
    logoUrl?: string;
    slug?: string;
};

type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  status: 'draft' | 'published' | 'archived';
  stock: number;
  price: number;
  slug: string;
};

const DetailItem = ({ label, value, children }: { label: string; value?: string | null, children?: React.ReactNode }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {value && <p className="font-semibold">{value}</p>}
        {children && <div className="font-semibold">{children}</div>}
    </div>
);


export default function ShopManagementPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const manufacturerId = params.id as string;
    const firestore = useFirestore();
    
    // --- State for Product Management ---
    const [productSearchTerm, setProductSearchTerm] = React.useState('');
    const [productStatusFilter, setProductStatusFilter] = React.useState<string[]>([]);

    const manufRef = useMemoFirebase(() => {
        if (!firestore || !manufacturerId) return null;
        return doc(firestore, 'manufacturers', manufacturerId);
    }, [firestore, manufacturerId]);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !manufacturerId) return null;
        return query(collection(firestore, 'manufacturers', manufacturerId, 'products'));
    }, [firestore, manufacturerId]);

    const { data: manufacturer, isLoading: isLoadingManufacturer } = useDoc<Manufacturer>(manufRef);
    const { data: allProducts, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const filteredProducts = React.useMemo(() => {
        if (!allProducts) return [];
        return allProducts.filter(p => {
            const matchesSearch = productSearchTerm ? 
                p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                p.id.toLowerCase().includes(productSearchTerm.toLowerCase())
                : true;
            
            const matchesStatus = productStatusFilter.length > 0 ? 
                productStatusFilter.includes(p.status)
                : true;

            return matchesSearch && matchesStatus;
        });
    }, [allProducts, productSearchTerm, productStatusFilter]);


    const getStatusVariant = (status: Product['status']) => {
        switch (status) {
            case 'published': return 'secondary';
            case 'draft': return 'outline';
            case 'archived': return 'destructive';
            default: return 'default';
        }
    };

    const toggleProductStatusFilter = (status: string) => {
        setProductStatusFilter(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    }

    const copyToClipboard = (text: string, entity: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: `${entity} ID Copied!`,
        });
    };
    
    if (isLoadingManufacturer) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
                    </div>
                    <div className="md:col-span-1 space-y-6">
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    </div>
                </div>
            </div>
        )
    }
    
    if (!manufacturer) {
        return notFound();
    }
    
     const getSellerStatus = (seller: Manufacturer) => {
        if (seller.suspensionDetails?.isSuspended) {
            return <Badge variant="destructive">Suspended</Badge>;
        }
        return <Badge variant={seller.verificationStatus === 'Verified' ? 'secondary' : 'destructive'}>{seller.verificationStatus}</Badge>;
    }
    
    return (
        <div className="space-y-6">
             <Breadcrumb className="mb-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboards/admin">Admin Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                         <BreadcrumbLink asChild>
                           <Link href="/dashboards/admin?tab=shop-management">Shop Management</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{manufacturer.shopName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                     {manufacturer.logoUrl && (
                        <Image src={manufacturer.logoUrl} alt={manufacturer.shopName || ''} width={40} height={40} className="rounded-full" />
                    )}
                    <div>
                        <h1 className="text-xl font-semibold">{manufacturer.shopName}</h1>
                        <div className="flex items-center gap-2">
                           <span className="text-sm text-muted-foreground">{manufacturer.email}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                       <Link href={`/manufacturer/${manufacturer.slug}`} target="_blank">
                           <Eye className="mr-2 h-4 w-4" /> View Public Profile
                       </Link>
                    </Button>
                     <SuspendShopModal seller={manufacturer}>
                         <Button variant={manufacturer.suspensionDetails?.isSuspended ? "secondary" : "destructive"} size="sm">
                            <AlertTriangle className="mr-1 h-4 w-4" /> {manufacturer.suspensionDetails?.isSuspended ? "Manage Suspension" : "Suspend"}
                        </Button>
                    </SuspendShopModal>
                </div>
            </div>
            
            <Separator />
            
            <div className="grid md:grid-cols-3 gap-6 items-start">
                 <div className="md:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Shop Products</CardTitle>
                             <CardDescription>Browse, search, and manage all products for this shop.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by product name or ID..." 
                                        className="pl-8"
                                        value={productSearchTerm}
                                        onChange={e => setProductSearchTerm(e.target.value)}
                                    />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-1">
                                        <ListFilter className="h-3.5 w-3.5" />
                                        <span>Filter Status</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {['published', 'draft', 'archived'].map(status => (
                                            <DropdownMenuCheckboxItem
                                                key={status}
                                                checked={productStatusFilter.includes(status)}
                                                onCheckedChange={() => toggleProductStatusFilter(status)}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                             <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Price (KES)</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingProducts ? (
                                            Array.from({length: 3}).map((_, i) => (
                                                <TableRow key={`skel-prod-${i}`}>
                                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : filteredProducts && filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) => (
                                                <TableRow key={product.id}>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Image
                                                            alt={product.name}
                                                            className="aspect-square rounded-md object-cover"
                                                            height="64"
                                                            src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                                                            width="64"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <p className="line-clamp-2">{product.name}</p>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <span>ID: {product.id}</span>
                                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(product.id, 'Product')}>
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Badge variant={getStatusVariant(product.status)}>{product.status}</Badge></TableCell>
                                                    <TableCell>{product.price?.toLocaleString() || 'N/A'}</TableCell>
                                                    <TableCell>{product.stock > 0 ? product.stock : <Badge variant="destructive">Out of Stock</Badge>}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                                                                 <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboards/seller-centre/products/edit/${product.id}`} target="_blank">
                                                                        <Edit className="mr-2 h-4 w-4" /> Edit Product
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                 <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboards/admin/products/analytics/${product.id}?manufacturerId=${manufacturerId}`}>
                                                                        <BarChart2 className="mr-2 h-4 w-4" /> View Analytics
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={6} className="text-center h-24">No products found for this shop.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                        </CardContent>
                     </Card>
                 </div>
                 <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shop Details</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <DetailItem label="Status">
                                {getSellerStatus(manufacturer)}
                            </DetailItem>
                            <DetailItem label="Rating" value={`${manufacturer.rating || 'N/A'} / 5`}/>
                            <DetailItem label="Industry" value={manufacturer.industry || 'N/A'} />
                            <DetailItem label="Registration Date" value={new Date(manufacturer.registrationDate?.seconds * 1000).toLocaleDateString()} />
                            <div className="grid gap-2">
                                <Label className="text-sm text-muted-foreground">Manufacturer ID</Label>
                                <div className="flex items-center gap-1">
                                    <Input value={manufacturer.id} readOnly className="h-8 text-xs font-mono" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(manufacturer.id, 'Manufacturer')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                         </CardContent>
                         <CardFooter>
                              <Button variant="outline" className="w-full" asChild>
                                <Link href={`/dashboards/admin/verifications/${manufacturer.id}`}>
                                  <UserCheck className="mr-2 h-4 w-4" /> View Verification Details
                                </Link>
                              </Button>
                         </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
