
'use client';

import * as React from 'react';
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
  PlusCircle,
  MoreHorizontal,
  File,
  ListFilter,
  Search,
  Loader2,
  BarChart2,
  Edit,
  Trash2,
  AlertTriangle,
  Pencil,
  Save,
  EyeOff,
  Copy,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logFeatureUsage } from '@/lib/analytics';
import { sendProductDeactivatedEmail } from '@/app/lib/actions/notifications';


type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  status: 'draft' | 'published' | 'archived';
  stock: number;
  price: number;
  isSponsored?: boolean;
};

type ManufacturerData = {
    verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
    suspensionDetails?: {
        isSuspended: boolean;
    }
}

type PlatformSettings = {
    allowUnverifiedUploads?: boolean;
}

const StockEditor = ({ product, onSave }: { product: Product, onSave: () => void }) => {
    const { user, role } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [newStock, setNewStock] = React.useState(product.stock);
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async () => {
        if (!user || !firestore || !role) return;
        if (isNaN(newStock) || newStock < 0) {
            toast({ title: "Invalid stock value", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        logFeatureUsage({ feature: 'products:quick_edit_stock', userId: user.uid, userRole: role, metadata: { productId: product.id, newStock } });
        const productRef = doc(firestore, 'manufacturers', user.uid, 'products', product.id);
        
        try {
            await updateDocumentNonBlocking(productRef, { stock: Number(newStock) });
            
            // Check if stock is now zero for a sponsored product
            if (Number(newStock) <= 0 && product.isSponsored) {
                 await sendProductDeactivatedEmail({
                    sellerEmail: user.email!,
                    sellerName: user.displayName || 'Seller',
                    productName: product.name,
                    reason: 'it ran out of stock'
                });
            }

            toast({ title: "Stock Updated" });
            onSave();
        } catch (error: any) {
            toast({ title: "Error updating stock", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Input 
                type="number" 
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="h-8 w-20"
                autoFocus
            />
            <Button size="icon" className="h-8 w-8" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
        </div>
    );
};


export default function SellerProductsPage() {
  const { user, role } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [stockFilter, setStockFilter] = React.useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [editingStock, setEditingStock] = React.useState<string | null>(null);

  // --- Data Fetching ---
  const manufacturerDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'manufacturers', user.uid);
  }, [user, firestore]);
  
  const platformSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'platformSettings', 'config');
  }, [firestore]);

  const { data: manufacturerData, isLoading: isLoadingManufacturer } = useDoc<ManufacturerData>(manufacturerDocRef);
  const { data: platformSettings, isLoading: isLoadingSettings } = useDoc<PlatformSettings>(platformSettingsRef);

  const productsQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(firestore, 'manufacturers', user.uid, 'products'),
      where('status', '!=', 'archived')
    );
  }, [firestore, user]);

  const {
    data: products,
    isLoading: isLoadingProducts,
    error,
    forceRefetch,
  } = useCollection<Product>(productsQuery);
  
  const isLoading = isLoadingProducts || isLoadingManufacturer || isLoadingSettings;

  // --- Handlers ---
  const handleArchive = (productId: string) => {
    if (!user || !role) return;
    logFeatureUsage({ feature: 'products:archive', userId: user.uid, userRole: role, metadata: { productId } });
    const productRef = doc(
      firestore,
      'manufacturers',
      user.uid,
      'products',
      productId
    );
    updateDocumentNonBlocking(productRef, { status: 'archived' });
    toast({
      title: `Product Archived`,
      description: `The product has been moved to the archive.`,
    });
  };
  
  const handleTakeDown = async (product: Product) => {
    if (!user || !role) return;
    logFeatureUsage({ feature: 'products:take_down', userId: user.uid, userRole: role, metadata: { productId: product.id } });
    const productRef = doc(
      firestore,
      'manufacturers',
      user.uid,
      'products',
      product.id
    );

    try {
        if (product.isSponsored) {
            await sendProductDeactivatedEmail({
                sellerEmail: user.email!,
                sellerName: user.displayName || 'Seller',
                productName: product.name,
                reason: 'you unpublished it from your dashboard'
            });
        }
        await updateDocumentNonBlocking(productRef, { status: 'draft' });
        toast({
          title: `Product Taken Down`,
          description: `The product has been unpublished and is no longer visible to buyers.`,
        });
    } catch(error: any) {
        toast({ title: 'Error', description: 'Could not take down product.', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard!',
      description: 'The Product ID has been copied.',
    });
  };

  const getStatusVariant = (status: Product['status']) => {
    switch (status) {
      case 'published':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'destructive';
    }
  };
  
  // --- Memoized Filtering ---
  const filteredProducts = React.useMemo(() => {
    if (!products) return null;

    return products
      .filter((product) => {
        if (activeTab === 'all') return true;
        return product.status === activeTab;
      })
      .filter((product) => {
        return product.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter((product) => {
        if (stockFilter === 'all') return true;
        if (stockFilter === 'inStock') return product.stock > 0;
        if (stockFilter === 'outOfStock') return product.stock === 0;
        return true;
      });
  }, [products, activeTab, searchQuery, stockFilter]);
  
  const handleFeatureClick = (feature: string, metadata?: Record<string, any>) => {
    if (user && role) {
      logFeatureUsage({ feature, userId: user.uid, userRole: role, metadata });
    }
  };
  
  // --- Render Logic ---
  const renderAlerts = () => {
    if (isLoading) return <Skeleton className="h-16 w-full" />;

    const isSuspended = manufacturerData?.suspensionDetails?.isSuspended;
    if (isSuspended) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Your Shop is Suspended</AlertTitle>
          <AlertDescription>
            While your shop is suspended, all of your products are hidden from the public. Please contact support to resolve this issue.
          </AlertDescription>
        </Alert>
      );
    }

    const isVerified = manufacturerData?.verificationStatus === 'Verified';
    const allowUnverifiedUploads = platformSettings?.allowUnverifiedUploads === true;
    if (!isVerified && !allowUnverifiedUploads) {
       return (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Your Shop is Not Verified</AlertTitle>
          <AlertDescription>
            Your products will not be visible to the public until your shop is verified. 
            <Button asChild variant="link" className="p-0 h-auto ml-1">
                <Link href="/dashboards/seller-centre/verification">Complete your verification</Link>
            </Button> 
            to publish your products.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  const renderProductRows = (productData: Product[] | null) => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={`skl-${i}`}>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-16 w-16 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-6 w-16" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ));
    }

    if (!productData || productData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            No products found. Check your filters or see alerts at the top of the page.
          </TableCell>
        </TableRow>
      );
    }

    return productData.map((product) => (
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
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(product.id)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(product.status)}>
            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
          </Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {editingStock === product.id ? (
            <StockEditor 
              product={product}
              onSave={() => {
                  setEditingStock(null);
                  forceRefetch(); // Force refetch after saving
              }}
            />
          ) : product.stock > 0 ? (
            product.stock
          ) : (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          KES {product.price?.toLocaleString() || '0'}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                  setEditingStock(product.id);
                  handleFeatureClick('products:quick_edit_stock_clicked', { productId: product.id });
                }}>
                <Pencil className="mr-2 h-4 w-4" /> Quick Edit Stock
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboards/seller-centre/products/analytics/${product.id}`} onClick={() => handleFeatureClick('products:view_analytics', { productId: product.id })}>
                  <BarChart2 className="mr-2 h-4 w-4" /> View Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboards/seller-centre/products/edit/${product.id}`} onClick={() => handleFeatureClick('products:full_edit', { productId: product.id })}>
                  <Edit className="mr-2 h-4 w-4" /> Full Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {product.status === 'published' && (
                <DropdownMenuItem onClick={() => handleTakeDown(product)}>
                    <EyeOff className="mr-2 h-4 w-4" /> Take Down
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleArchive(product.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  const productTable = (
     <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Stock</TableHead>
            <TableHead className="hidden md:table-cell">Price</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderProductRows(filteredProducts)}</TableBody>
      </Table>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>My Products</CardTitle>
              <CardDescription>
                Manage your product catalog, inventory, and pricing.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleFeatureClick('products:export')}>
                <File className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button asChild onClick={() => handleFeatureClick('products:add_new_clicked')}>
                <Link href="/dashboards/seller-centre/products/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {renderAlerts()}

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search products..." className="pl-8" value={searchQuery} onChange={e => {
                      setSearchQuery(e.target.value);
                      handleFeatureClick('products:search', { query: e.target.value });
                    }} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handleFeatureClick('products:filter_menu_opened')}>
                      <ListFilter className="h-3.5 w-3.5" />
                      <span>Filter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Stock</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={stockFilter === 'all'}
                      onCheckedChange={() => setStockFilter('all')}
                    >
                      All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={stockFilter === 'inStock'}
                      onCheckedChange={() => setStockFilter('inStock')}
                    >
                      In Stock
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={stockFilter === 'outOfStock'}
                      onCheckedChange={() => setStockFilter('outOfStock')}
                    >
                      Out of Stock
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <TabsContent value="all" className="mt-4">
              {productTable}
            </TabsContent>
            <TabsContent value="published" className="mt-4">
              {productTable}
            </TabsContent>
            <TabsContent value="draft" className="mt-4">
              {productTable}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
